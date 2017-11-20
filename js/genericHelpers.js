define(["jquery"], ($) =>{
	return {
		datasetToArray: function (ds, key){
			let r = [];
			ds.forEach((v) =>{
				r.push(v[key]);
			});
			return r;
		},

		htmlEncode: function (string){
			string = $("<div>").text(string).html();
			string = string.replace(/(?:\r\n|\r|\n)/g, '<br/>');
			return string;
		},

		printout: function (text, escape){
			if(escape){
				text = this.htmlEncode(escape);
			}
			$("#printout").html(text);
		},

		flatten: function (map){
			let r = [];
			for(let i in map){
				r.push(map[i]);
			}
			return r;
		},

		rotate: function (map){
			let r = {};
			for(let i in map){
				if(map[i] in r){
					r[map[i]].push(i);
				}
				else{
					r[map[i]] = [i];
				}
			}
			return r;
		},

		max: function (iterable){
			return iterable.reduce((a, b) =>{
				return Math.max(a, b);
			});
		},

		toTitleCase: function (str){
			return str.replace(/(?:^|\s)\w/g, function (match){
				return match.toUpperCase();
			});
		},
	};
});
