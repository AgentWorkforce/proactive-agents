import "sst";

declare module "sst" {
  export interface Resource {
    NangoSyncQueue: {
      type: "sst.aws.Queue";
      url: string;
    };
  }
}
