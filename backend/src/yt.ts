import { Innertube, ClientType } from 'youtubei.js';

let ytMusicPromise: Promise<Innertube> | null = null;
let ytIosPromise: Promise<Innertube> | null = null;

export function getYtMusic(): Promise<Innertube> {
  if (!ytMusicPromise) {
    ytMusicPromise = Innertube.create({
      cache: undefined,
    }).catch((err: unknown) => {
      ytMusicPromise = null;
      throw err;
    });
  }
  return ytMusicPromise!;
}

export function getYtIos(): Promise<Innertube> {
  if (!ytIosPromise) {
    ytIosPromise = Innertube.create({
      client_type: ClientType.IOS,
      cache: undefined,
    }).catch((err: unknown) => {
      ytIosPromise = null;
      throw err;
    });
  }
  return ytIosPromise!;
}
