import { Innertube, ClientType } from 'youtubei.js';

let ytPromise: Promise<Innertube> | null = null;
let ytIosPromise: Promise<Innertube> | null = null;

export function getYtMusic(): Promise<Innertube> {
  if (!ytPromise) {
    ytPromise = Innertube.create({ cache: undefined }).catch((err) => {
      ytPromise = null;
      throw err;
    });
  }
  return ytPromise!;
}

export function getYtIos(): Promise<Innertube> {
  if (!ytIosPromise) {
    ytIosPromise = Innertube.create({ client_type: ClientType.IOS, cache: undefined }).catch((err) => {
      ytIosPromise = null;
      throw err;
    });
  }
  return ytIosPromise!;
}
