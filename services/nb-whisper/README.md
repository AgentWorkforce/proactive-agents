# nb-whisper — serverless dialect-accurate STT (Modal)

NB-Whisper (National Library of Norway) on a serverless L4 GPU that scales to
zero. This is the transcription endpoint for the meeting-actions pipeline — the
piece Cloudflare **cannot** host (Workers AI only serves vanilla Whisper, which
fails on the Ålesund/Sunnmøre dialect). The Cloudflare Worker
(`packages/transcription-worker`) calls this over HTTPS.

## Why this and not Deepgram

- **Dialect:** NB-Whisper is trained on 66k hours across Norway's dialects (Møre
  included). Deepgram's named West-Norwegian coverage is Bergen — a different
  dialect from Ålesund. Empirically validated per-recording (see the test
  script), but NB-Whisper is the stronger a-priori bet.
- **Cost:** ~$0.08–0.12 per 1-hour call (L4 at $0.84/hr × ~5min compute,
  per-second billing, scale-to-zero) — actually cheaper than Deepgram's $0.26.
- **License:** Apache-2.0 → resale to the customer is fine (credit the National
  Library of Norway somewhere for Norway downloads).
- **Adaptable:** if it's close-but-imperfect on his dialect, the weights are
  open — fine-tune on his calls. No hosted API lets you do that.

## Models

- `NbAiLab/nb-whisper-large` — verbatim (default)
- `NbAiLab/nb-whisper-large-semantic` — normalizes dialect speech to clean
  written Norwegian; better for action-item extraction

Switch via the secret: `modal secret create nb-whisper-auth AUTH_TOKEN=... NB_WHISPER_MODEL=NbAiLab/nb-whisper-large-semantic`

## Deploy

```sh
pip install modal
modal token new                                          # one-time auth
modal secret create nb-whisper-auth AUTH_TOKEN=$(openssl rand -hex 32)
modal deploy app.py                                      # prints the https URL
```

Copy the printed URL + the AUTH_TOKEN — those become `MODAL_NBWHISPER_URL` /
`MODAL_NBWHISPER_TOKEN` for the test script and the Cloudflare Worker.

## Test it directly

```sh
# raw audio file
curl -X POST "$MODAL_NBWHISPER_URL/transcribe?language=no" \
  -H "Authorization: Bearer $MODAL_NBWHISPER_TOKEN" \
  -H "Content-Type: audio/wav" --data-binary @call.wav

# or a URL (e.g. a Recall pre-signed S3 link) — no download needed
curl -X POST "$MODAL_NBWHISPER_URL/transcribe" \
  -H "Authorization: Bearer $MODAL_NBWHISPER_TOKEN" \
  -H "Content-Type: application/json" -d '{"url":"https://.../call.m4a"}'
```

First call cold-starts (model download → cached in a Modal Volume); subsequent
calls are fast until it scales to zero.

## The dialect proof point

From `watchdog-agents`, point the comparison script at this endpoint and run his
real Ålesund recording through NB-Whisper **and** Deepgram in one shot:

```sh
MODAL_NBWHISPER_URL=...  MODAL_NBWHISPER_TOKEN=...  DEEPGRAM_API_KEY=... \
  node scripts/stt-test.mjs ./his-call.wav --engines modal,deepgram
```

Read both transcripts against what he actually said. Whichever wins becomes the
`STT_ENDPOINT` for the pipeline — no other code changes.

## Notes

- Uses the HF `transformers` ASR pipeline (correct for NbAiLab checkpoints). For
  more throughput later, convert to CTranslate2 + faster-whisper — same model,
  ~4× faster, lower per-call cost.
- L4 is the cost sweet spot. Bump to A10G in `@app.cls(gpu=...)` only if you need
  more headroom.
