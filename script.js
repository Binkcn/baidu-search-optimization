// ==UserScript==
// @name         百度搜索优化插件（精简版）
// @description  显示原始网址，移除重定向，针对网址进行过滤。
// @namespace    binkcn@nga
// @create       2019-01-25
// @lastmodified 2019-01-25
// @version      0.2
// @license      GNU GPL v3
// @author       Binkcn
// @connect      www.baidu.com
// @include      *://www.baidu.com/*
// @grant        GM_xmlhttpRequest
// @note         2019-01-25 Version 0.2 每100毫秒执行一次过滤效果，解决在Ajax搜索下过滤不生效的问题。同时增加对新闻搜索结果的过滤。
// @note         2019-01-25 Version 0.1 第一个版本发布。
// ==/UserScript==

(function() {
	'use strict';

	var blockList = ['baijiahao.baidu.com', 'jingyan.baidu.com'];

	setInterval(function(){
		var domList = document.querySelectorAll('h3.t > a, .c-row > a');

		for (var i = 0; i < domList.length; i++) {
			var a = domList[i];
			var ahref = a.href;

			if (a != null && a.getAttribute("parseRedirectStatus") == null) {
				a.setAttribute("parseRedirectStatus", "0");

				if (ahref.indexOf("www.baidu.com/link") > -1) {
					(function (ahref) {
						var url = ahref.replace(/^http:$/, 'https:');

						var xhr = GM_xmlhttpRequest({
							extData: ahref,
							url: url,
							headers: {"Accept": "*//*", "Referer": ahref.replace(/^http:/, "https:")},
							method: "GET",
							timeout: 5000,
							onreadystatechange: function (response) {
								if (response.responseHeaders.indexOf("tm-finalurl") >= 0) {
									var realUrl = getRegx(response.responseHeaders, "tm-finalurl\\w+: ([^\\s]+)");
									if (realUrl == null || realUrl == '' || realUrl.indexOf("www.baidu.com/search/error") > 0) return;

									doParseRedirectStatus(xhr, ahref, realUrl);
								}
							}
						});
					})(ahref);
				}
			}
		}
	}, 100);

	var doParseRedirectStatus = function (xhr, ahref, realUrl) {
		if (realUrl == null || realUrl == "" || typeof(realUrl) == "undefined") return;

		if (realUrl.indexOf("www.baidu.com/link") < 0) {
			try {
				var domList = document.querySelectorAll("a[href*='" + ahref + "']");
				for (var i = 0; i < domList.length; i++) {
					var a = domList[i];

					// Reset real url.
					a.setAttribute("parseRedirectStatus", "1");
					a.setAttribute("href", realUrl);

					// Hide block list.
					var node2 = a.parentNode.parentNode;
					if (node2.className.indexOf("c-container") >= 0) {
						for(var j = 0; j < blockList.length; j++){
							if(getHost(realUrl) == blockList[j]){
								console.log('Block Host Hit', realUrl);

								node2.style = "display:none";
							}
						}
					}

					var node1 = a.parentNode;
					if (node1.className.indexOf("c-row") >= 0) {
						for(var k = 0; k < blockList.length; k++){
							if(getHost(realUrl) == blockList[k]){
								console.log('Block Host Hit', realUrl);

								node1.style = "display:none";
							}
						}
					}

					// Show url.
					if (a.className.indexOf("c-showurl") >= 0) {
						if(a.querySelector('span') != null){

							if(realUrl.length < 40){
								a.innerHTML = realUrl;
							}else{
								a.innerHTML = realUrl.substring(0, 40) + '...&nbsp;';
							}
						}
					}
				}
				xhr.abort();
			} catch (e) {

			}
		}
	};

	function getRegx(string, reg) {
		var RegE = new RegExp(reg);
		try {
			return RegE.exec(string)[1];
		} catch (e) {
			return '';
		}
	}

	function getHost(string) {
		return string.replace(/(\/[^/]*|\s*)/, "").replace(/<[^>]*>/g, "").replace(/https?:\/\//g, "").replace(/<\/?strong>/g, "").replace(/<\/?b>/g, "").replace(/<?>?/g, "").replace(/( |\/).*/g, "");
	}
})();

