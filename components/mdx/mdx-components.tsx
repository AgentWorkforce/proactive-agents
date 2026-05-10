import * as React from "react";
import { Sidenote } from "./sidenote";
import { Callout, PullQuote, Marginalia } from "./callout";
import { Scene } from "./scene";
import {
  PollingFigure,
  ProactiveFigure,
  TripleFigure,
  WebhookTaxFigure,
  RuntimeFigure,
} from "./figures";

export const mdxComponents = {
  Sidenote,
  Callout,
  PullQuote,
  Marginalia,
  Scene,
  PollingFigure,
  ProactiveFigure,
  TripleFigure,
  WebhookTaxFigure,
  RuntimeFigure,
  // Wobbly highlight on inline strong
  mark: (props: React.HTMLAttributes<HTMLElement>) => (
    <mark className="scribble-highlight bg-transparent text-ink" {...props} />
  ),
};
