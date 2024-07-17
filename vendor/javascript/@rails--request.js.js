class FetchResponse {
  constructor(t) {
    this.response = t;
  }
  get statusCode() {
    return this.response.status;
  }
  get redirected() {
    return this.response.redirected;
  }
  get ok() {
    return this.response.ok;
  }
  get unauthenticated() {
    return 401 === this.statusCode;
  }
  get unprocessableEntity() {
    return 422 === this.statusCode;
  }
  get authenticationURL() {
    return this.response.headers.get("WWW-Authenticate");
  }
  get contentType() {
    const t = this.response.headers.get("Content-Type") || "";
    return t.replace(/;.*$/, "");
  }
  get headers() {
    return this.response.headers;
  }
  get html() {
    return this.contentType.match(/^(application|text)\/(html|xhtml\+xml)$/)
      ? this.text
      : Promise.reject(
          new Error(
            `Expected an HTML response but got "${this.contentType}" instead`
          )
        );
  }
  get json() {
    return this.contentType.match(/^application\/.*json$/)
      ? this.responseJson || (this.responseJson = this.response.json())
      : Promise.reject(
          new Error(
            `Expected a JSON response but got "${this.contentType}" instead`
          )
        );
  }
  get text() {
    return this.responseText || (this.responseText = this.response.text());
  }
  get isTurboStream() {
    return this.contentType.match(/^text\/vnd\.turbo-stream\.html/);
  }
  async renderTurboStream() {
    if (!this.isTurboStream)
      return Promise.reject(
        new Error(
          `Expected a Turbo Stream response but got "${this.contentType}" instead`
        )
      );
    window.Turbo
      ? await window.Turbo.renderStreamMessage(await this.text)
      : console.warn(
          "You must set `window.Turbo = Turbo` to automatically process Turbo Stream events with request.js"
        );
  }
}
class RequestInterceptor {
  static register(t) {
    this.interceptor = t;
  }
  static get() {
    return this.interceptor;
  }
  static reset() {
    this.interceptor = void 0;
  }
}
function getCookie(t) {
  const e = document.cookie ? document.cookie.split("; ") : [];
  const n = `${encodeURIComponent(t)}=`;
  const s = e.find((t) => t.startsWith(n));
  if (s) {
    const t = s.split("=").slice(1).join("=");
    if (t) return decodeURIComponent(t);
  }
}
function compact(t) {
  const e = {};
  for (const n in t) {
    const s = t[n];
    void 0 !== s && (e[n] = s);
  }
  return e;
}
function metaContent(t) {
  const e = document.head.querySelector(`meta[name="${t}"]`);
  return e && e.content;
}
function stringEntriesFromFormData(t) {
  return [...t].reduce(
    (t, [e, n]) => t.concat("string" === typeof n ? [[e, n]] : []),
    []
  );
}
function mergeEntries(t, e) {
  for (const [n, s] of e)
    if (!(s instanceof window.File))
      if (t.has(n) && !n.includes("[]")) {
        t.delete(n);
        t.set(n, s);
      } else t.append(n, s);
}
class FetchRequest {
  constructor(t, e, n = {}) {
    this.method = t;
    this.options = n;
    this.originalUrl = e.toString();
  }
  async perform() {
    try {
      const t = RequestInterceptor.get();
      t && (await t(this));
    } catch (t) {
      console.error(t);
    }
    const t = new FetchResponse(
      await window.fetch(this.url, this.fetchOptions)
    );
    if (t.unauthenticated && t.authenticationURL)
      return Promise.reject((window.location.href = t.authenticationURL));
    const e = t.ok || t.unprocessableEntity;
    e && t.isTurboStream && (await t.renderTurboStream());
    return t;
  }
  addHeader(t, e) {
    const n = this.additionalHeaders;
    n[t] = e;
    this.options.headers = n;
  }
  sameHostname() {
    if (!this.originalUrl.startsWith("http:")) return true;
    try {
      return new URL(this.originalUrl).hostname === window.location.hostname;
    } catch (t) {
      return true;
    }
  }
  get fetchOptions() {
    return {
      method: this.method.toUpperCase(),
      headers: this.headers,
      body: this.formattedBody,
      signal: this.signal,
      credentials: this.credentials,
      redirect: this.redirect,
    };
  }
  get headers() {
    const t = {
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": this.contentType,
      Accept: this.accept,
    };
    this.sameHostname() && (t["X-CSRF-Token"] = this.csrfToken);
    return compact(Object.assign(t, this.additionalHeaders));
  }
  get csrfToken() {
    return getCookie(metaContent("csrf-param")) || metaContent("csrf-token");
  }
  get contentType() {
    return this.options.contentType
      ? this.options.contentType
      : null == this.body || this.body instanceof window.FormData
      ? void 0
      : this.body instanceof window.File
      ? this.body.type
      : "application/json";
  }
  get accept() {
    switch (this.responseKind) {
      case "html":
        return "text/html, application/xhtml+xml";
      case "turbo-stream":
        return "text/vnd.turbo-stream.html, text/html, application/xhtml+xml";
      case "json":
        return "application/json, application/vnd.api+json";
      default:
        return "*/*";
    }
  }
  get body() {
    return this.options.body;
  }
  get query() {
    const t = (this.originalUrl.split("?")[1] || "").split("#")[0];
    const e = new URLSearchParams(t);
    let n = this.options.query;
    n =
      n instanceof window.FormData
        ? stringEntriesFromFormData(n)
        : n instanceof window.URLSearchParams
        ? n.entries()
        : Object.entries(n || {});
    mergeEntries(e, n);
    const s = e.toString();
    return s.length > 0 ? `?${s}` : "";
  }
  get url() {
    return this.originalUrl.split("?")[0].split("#")[0] + this.query;
  }
  get responseKind() {
    return this.options.responseKind || "html";
  }
  get signal() {
    return this.options.signal;
  }
  get redirect() {
    return this.options.redirect || "follow";
  }
  get credentials() {
    return this.options.credentials || "same-origin";
  }
  get additionalHeaders() {
    return this.options.headers || {};
  }
  get formattedBody() {
    const t = "[object String]" === Object.prototype.toString.call(this.body);
    const e = "application/json" === this.headers["Content-Type"];
    return e && !t ? JSON.stringify(this.body) : this.body;
  }
}
async function get(t, e) {
  const n = new FetchRequest("get", t, e);
  return n.perform();
}
async function post(t, e) {
  const n = new FetchRequest("post", t, e);
  return n.perform();
}
async function put(t, e) {
  const n = new FetchRequest("put", t, e);
  return n.perform();
}
async function patch(t, e) {
  const n = new FetchRequest("patch", t, e);
  return n.perform();
}
async function destroy(t, e) {
  const n = new FetchRequest("delete", t, e);
  return n.perform();
}
export {
  FetchRequest,
  FetchResponse,
  RequestInterceptor,
  destroy,
  get,
  patch,
  post,
  put,
};
