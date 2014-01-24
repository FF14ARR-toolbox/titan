;(function($, undefined) {
	"use strict";
 
	$.fn.playAudio = function(option) {
		var a, b, c;
 
		//※未設定のオプション項目に初期値を設定
		option = $.extend({
			opt1: null,
			opt2: null
		}, option);
 
		//※プラグイン内部でのみ使用される関数
		function DoSomething(e) {
 
		}
 
		//※対象要素群のそれぞれに対し何かする
		this.each(function() {
			//DoSomething($(this));
			var audio = $(this).get();
		console.log($(this).attr('preload'));
		console.log(audio);
		});
 
		//※外部から参照可能な関数
		$.fn.publicMethod = function( options ) { 
			//
		};
 
		// 何かする
		var audio = this.get(0);
		console.log(audio);
		audio.play();

		return this;
	};
})(jQuery);