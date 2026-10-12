// Redirects www.wewillfind.it → wewillfind.it, keeping the path and query string.
const worker = {
  fetch(request) {
    const url = new URL(request.url);
    url.hostname = "wewillfind.it";
    return Response.redirect(url.toString(), 301);
  },
};

export default worker;
