(function(g,h){var l=g.AFSAnalyticsObject,f=g[l].config,m=g.testTracking||{},d;f.prod=0;f.brand=0;f.site=0;d={location:m.location||g.location,addHandler:function(a,c,b){a.addEventListener?a.addEventListener(c,b,!1):a.attachEvent&&a.attachEvent("on"+c,b)},onReady:function(a){/complete/.test(h.readyState)?a():d.addHandler(g,"load",function(){setTimeout(a,4)})},scriptElement:function(a){var c=h.getElementById(a),b=h.getElementsByTagName("script")[0];if(c)return c;c=h.createElement("script");c.id=a;c.async=
1;b.parentNode.insertBefore(c,b);return c},cookieRead:function(a){return decodeURIComponent(h.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*"+encodeURIComponent(a).replace(/[\-\.\+\*]/g,"\\$&")+"\\s*\\=\\s*([^;]*).*$)|^.*$"),"$1"))||""},cookieWrite:function(a,c,b,e,d,g){if(!a||/^(?:expires|max-age|path|domain|secure)$/i.test(a))return!1;var f="";b&&b.constructor===Date&&(f="; expires="+b.toUTCString());h.cookie=encodeURIComponent(a)+"="+encodeURIComponent(c)+f+(d?"; domain="+d:"")+(e?"; path="+e:"")+
(g?"; secure":"");return!0},cloneObject:function(a,c){var b;b=a&&a.constructor?a.constructor:void 0;var e,g,f,h,k;if(!a||b!==RegExp&&b!==Date&&b!==Function&&b!==Object&&b!==Array)return a;switch(b){case RegExp:b=new b(a.source,"g".substr(0,Number(a.global))+"i".substr(0,Number(a.ignoreCase))+"m".substr(0,Number(a.multiline)));break;case Date:b=new b(a.getTime());break;case Function:b=a;break;default:b=new b}c=c||[];e=0;for(g=c.length;e<g;e++)if(f=c[e],f[0]===a){h=f[1];break}if(h)return h;c.push([a,
b]);for(k in a)a.hasOwnProperty(k)&&(b[k]=a[k]===a?b:d.cloneObject(a[k],c));return b},addCallback:function(a,c,b){var e=d.addCallback;e.q=e.q||[];a.readyState?(e.q.push(b),a.onreadystatechange=function(){var b;if(/loaded|complete/.test(a.readyState)&&c())for(a.onreadystatechange=null;e.q.length;)b=e.q.shift(),b()}):d.addHandler(a,"load",function(){c()&&b()})},tracker:function(){var a=Array.prototype.slice.call(arguments),c=a.shift();c&&("function"===typeof c?c():d.send[c]&&d.send[c].apply(g,a))},
processQueue:function(){var a=g[l].q,c=d.tracker;for(c.config=f;a&&a.length;)c.apply(g,a.shift());g[l]=c},pageSetup:function(){var a=d.scriptElement("omniture-scode"),c=m.location?"s_code_dev.js":"/content/dam/public/wbc/analytics/s_code_www.js",b=function(){return g.s&&g.s.w_trackPage},e;/^(?:help|ww2)\.westpac\.com\.au$/i.test(location.hostname)&&(f.prod=!0);e=d.location.hostname.split(".");/^(www\.)?westpac\.com\.(fj|pg)$/i.test(location.hostname)&&(f.prod=!0);/\.?westpac\.com\.(fj|pg)$/i.test(d.location.hostname)&&
(f.brand="wbc-"+e[e.length-1],/^westpac$/i.test(e[0])?f.site="www":f.site=e[0]);d.onReady(function(){f.lc=+new Date;a.src=c;d.addCallback(a,b,function(){d.processQueue()})})},send:{impression:function(a){s.w_trackImpression(a)},page:function(a){a=d.cloneObject(a||{});a.siteVersion||(a.siteVersion="analytics_www.js:20160809");s.w_trackPage(a)}}};l&&d.pageSetup()})(window,document);