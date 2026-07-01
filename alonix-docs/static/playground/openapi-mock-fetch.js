/**
 * Browser-side OpenAPI mock — returns example responses without Prism or a VM.
 */
(function (global) {
  var MOCK_HOST = 'playground.mock';

  function pathToRegex(openApiPath) {
    var pattern = openApiPath.replace(/\{[^}]+\}/g, '[^/]+').replace(/\//g, '\\/');
    return new RegExp('^' + pattern + '$');
  }

  function normalizePath(pathname) {
    var path = pathname || '/';
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    return path;
  }

  function findRoute(fixtures, method, pathname) {
    var path = normalizePath(pathname);
    var m = (method || 'get').toLowerCase();
    for (var i = 0; i < fixtures.routes.length; i++) {
      var route = fixtures.routes[i];
      if (route.method !== m) continue;
      if (route.path === path) return route;
      if (pathToRegex(route.path).test(path)) return route;
    }
    return null;
  }

  function jsonResponse(status, body) {
    if (status === 204) {
      return new Response(null, {status: 204, statusText: 'No Content'});
    }
    return new Response(JSON.stringify(body), {
      status: status,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-Source': 'openapi-examples',
      },
    });
  }

  function isSpecRequest(url, specUrl) {
    if (!specUrl) return false;
    try {
      var target = new URL(url, global.location.href);
      var spec = new URL(specUrl, global.location.href);
      return target.pathname === spec.pathname;
    } catch (e) {
      return String(url).indexOf('openapi.yaml') !== -1 || String(url).indexOf('openapi.json') !== -1;
    }
  }

  function isMockApiRequest(url) {
    try {
      var u = new URL(url, global.location.href);
      if (u.hostname === MOCK_HOST) return true;
      if (u.hostname === 'localhost' && u.port === '4010') return true;
      if (u.hostname === '127.0.0.1' && u.port === '4010') return true;
    } catch (e) {
      /* ignore */
    }
    return false;
  }

  function createOpenApiMockFetch(fixtures, specUrl) {
    var nativeFetch = global.fetch.bind(global);

    return function customFetch(input, init) {
      var url = typeof input === 'string' ? input : input && input.url ? input.url : String(input);

      if (isSpecRequest(url, specUrl)) {
        return nativeFetch(input, init);
      }

      if (!isMockApiRequest(url)) {
        return nativeFetch(input, init);
      }

      var requestUrl = new URL(url, global.location.href);
      var method = (init && init.method) || 'GET';
      var route = findRoute(fixtures, method, requestUrl.pathname);

      if (!route) {
        return Promise.resolve(
          jsonResponse(404, {
            message: 'No mock example for ' + method.toUpperCase() + ' ' + requestUrl.pathname,
          })
        );
      }

      return Promise.resolve(jsonResponse(route.status, route.body));
    };
  }

  global.OpenApiMockFetch = {
    MOCK_HOST: MOCK_HOST,
    mockServerUrl: 'https://' + MOCK_HOST,
    createOpenApiMockFetch: createOpenApiMockFetch,
    loadFixtures: function (fixturesUrl) {
      return global.fetch(fixturesUrl).then(function (res) {
        if (!res.ok) throw new Error('Failed to load mock fixtures');
        return res.json();
      });
    },
  };
})(window);
