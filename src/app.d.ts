// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Error {
      code: string;
      id: string;
    }

    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  declare const APP_AUTHOR: string;
  declare const APP_VERSION: string;
  declare const APP_BUGS_URL: string;
  declare const APP_REPOSITORY_URL: string;
}

export {};
