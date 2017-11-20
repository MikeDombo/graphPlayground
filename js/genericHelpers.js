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

		equalsObject: function (obj1, obj2){
			//Loop through properties in object 1
			for(let p in obj1){
				//Check property exists on both objects
				if(obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)){
					return false;
				}

				switch(typeof (obj1[p])){
					//Deep compare objects
					case 'object':
						if(!Object.compare(obj1[p], obj2[p])){
							return false;
						}
						break;
					//Compare function code
					case 'function':
						if(typeof (obj2[p]) === 'undefined' || (p !== 'compare' && obj1[p].toString() !== obj2[p].toString())){
							return false;
						}
						break;
					//Compare values
					default:
						if(obj1[p] !== obj2[p]){
							return false;
						}
				}
			}

			//Check object 2 for any extra properties
			for(let p in obj2){
				if(typeof (obj1[p]) === 'undefined'){
					return false;
				}
			}
			return true;
		},
	};
});
