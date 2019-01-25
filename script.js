// ==UserScript==
// @name         百度搜索优化插件（精简版）
// @description  显示原始网址，移除重定向，针对网址进行过滤。
// @namespace    binkcn@nga
// @create       2019-01-25
// @lastmodified 2019-01-25
// @version      0.1
// @license      GNU GPL v3
// @author       Binkcn
// @connect      www.baidu.com
// @include      *://www.baidu.com/*
// @grant        GM_xmlhttpRequest
// @note         2019-01-25 Version 1.0 第一个版本发布。
// ==/UserScript==

(function() {
	'use strict';

	var blockList = ['baijiahao.baidu.com', 'jingyan.baidu.com'];

	var domList = document.querySelectorAll('h3.t > a');

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
					var node = a.parentNode.parentNode;
					if (node.className.indexOf("c-container") >= 0) {
						for(var j = 0; j < blockList.length; j++){
							var host = getHost(realUrl);

							if(host == blockList[j]){
								console.log('Block Host Hit', host);

								node.style = "display:none";
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

