import "es6-promise/auto";
import "isomorphic-fetch";
import { checkForErrors } from "./utils/check-for-errors";
import { encodeFormData, FormData } from "./utils/encode-form-data";
import { encodeQueryString } from "./utils/encode-query-string";

export { FormData };

export interface IAuthenticationManager {
  getToken(url: string): Promise<string>;
}

/**
 * HTTP methods used by the ArcGIS REST API.
 */
export type HTTPMethods = "GET" | "POST";

/**
 * Valid response formats for the `f` parameter.
 */
export type ResponseFormats =
  | "json"
  | "geojson"
  | "text"
  | "html"
  | "image"
  | "zip";

export interface IParams {
  f?: ResponseFormats;
  [key: string]: any;
}

/**
 * Options for the [`request()`](/api/arcgis-core/request/) method.
 */
export interface IRequestOptions {
  /**
   * The HTTP method to send the request with.
   */
  httpMethod?: HTTPMethods;

  /**
   * The instance of `IAuthenticationManager` to use to authenticate this request.
   */
  authentication?: IAuthenticationManager;
}

/**
 * Generic method for making HTTP requests to ArcGIS REST API endpoints.
 *
 * ```js
 * import { request } from 'arcgis-core';
 *
 * request('https://www.arcgis.com/sharing/rest')
 *   .then((response) => {
 *     console.log(response.currentVersion); // => 5.2
 *   });
 * ```
 *
 * ```js
 * import { request, HTTPMethods } from 'arcgis-core';
 *
 * request('https://www.arcgis.com/sharing/rest', {}, {
 *   httpMethod: "GET"
 * }).then((response) => {
 *   console.log(response.currentVersion); // => 5.2
 * });
 * ```
 *
 * ```js
 * import { request, HTTPMethods } from 'arcgis-core';
 *
 * request('https://www.arcgis.com/sharing/rest/search', {
 *   q: 'parks'
 * }).then((response) => {
 *   console.log(response.total); // => 78379
 * });
 * ```
 *
 * @param url - The URL of the ArcGIS REST API endpoint.
 * @param params - The parameters to pass to the endpoint.
 * @param requestOptions - Options for the request.
 * @returns A Promise that will resolve with the data from the request.
 */
export function request(
  url: string,
  requestParams: IParams = { f: "json" },
  requestOptions?: IRequestOptions
): Promise<any> {
  const { httpMethod, authentication }: IRequestOptions = {
    ...{ httpMethod: "POST" },
    ...requestOptions
  };

  const params: IParams = {
    ...{ f: "json" },
    ...requestParams
  };

  const options: RequestInit = {
    method: httpMethod
  };

  const tokenRequest = authentication
    ? authentication.getToken(url)
    : Promise.resolve("");

  return tokenRequest.then(token => {
    if (token.length) {
      params.token = token;
    }

    if (httpMethod === "GET") {
      url = url + "?" + encodeQueryString(params);
    }

    if (httpMethod === "POST") {
      options.body = encodeFormData(params);
    }

    return fetch(url, options)
      .then(response => {
        switch (params.f) {
          case "json":
            return response.json();
          case "geojson":
            return response.json();
          /* istanbul ignore next blob responses are difficult to make cross platform we will just have to trust the isomorphic fetch will do its job */
          case "image":
            return response.blob();
          case "html":
            return response.text();
          case "text":
            return response.text();
          /* istanbul ignore next blob responses are difficult to make cross platform we will just have to trust the isomorphic fetch will do its job */
          case "zip":
            return response.blob();
        }
      })
      .then(data => {
        if (params.f === "json" || params.f === "geojson") {
          checkForErrors(data);
          return data;
        } else {
          return data;
        }
      });
  });
}
