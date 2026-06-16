// AWS adapter config for `@opennextjs/aws build`.
//
// Admin is fully dynamic and does not use ISR/tag revalidation. Disabling the
// tag cache prevents SST from running OpenNext's deploy-time RevalidationSeed
// Lambda for this app on every production deploy.
export default {
  dangerous: {
    disableTagCache: true,
  },
  default: {
    override: {},
  },
};
