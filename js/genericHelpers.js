define(["jquery"], ($) =>{
	return {
		datasetToArray: function (ds, key){
			let r = [];
			ds.forEach((v) =>{
				r.push(v[key]);
			});
			return r;
		},

		datasetToArrayMap: function (ds){
			let r = [];
			ds.forEach((v) =>{
				r.push(v);
			});
			return r;
		},

		keepOnlyKeys: function (arr, keys){
			arr = arr.slice();
			arr.forEach((v) =>{
				let k = Object.keys(v);
				k.forEach((key) =>{
					if(keys.indexOf(key) < 0){
						delete v[key];
					}
				});
			});
			return arr;
		},

		getFileExtension: function (filename){
			return filename.split(".").splice(-1)[0];
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

		showErrorModal: function (title, body){
			let $modal = ($("<div>", {class: "modal fade", tabindex: "-1", role: "dialog", "aria-hidden": "true"}));
			$modal
				.append($("<div>", {class: "modal-dialog"})
					.append($("<div>", {class: "modal-content"})
						.append($("<div>", {class: "modal-header"})
							.append($("<h5>", {class: "modal-title"}).text(title))
							.append($("<button>", {class: "close", "data-dismiss": "modal", "aria-label": "close"})
								.append($("<span>", {"aria-hidden": "true"}).html("&times;"))
							)
						)
						.append($("<div>", {class: "modal-body"}).html(body))
					)
				);
			$modal.on("hidden.bs.modal", () =>{
				$modal.remove();
			});
			$modal.modal("show");
		},

		showFormModal: function (successCb, title, successText, form){
			let f = $("<div>", {class: "modal-body form-group"});
			form.forEach((formRow, i) =>{
				let basicMap = {class: "form-control", id: "form-modal-" + i};

				if("extraAttrs" in formRow){
					for(let attrname in formRow.extraAttrs){
						basicMap[attrname] = formRow.extraAttrs[attrname];
					}
				}

				if(formRow.type === "numeric"){
					f.append($("<label>", {for: "form-modal-" + 1, class: "col-form-label"}).text(formRow.label));
					basicMap.type = "number";
					f.append($("<input>", basicMap));
				}
				else if(formRow.type === "text"){
					f.append($("<label>", {for: "form-modal-" + 1, class: "col-form-label"}).text(formRow.label));
					basicMap.type = "text";
					f.append($("<input>", basicMap));
				}
				else if(formRow.type === "textarea"){
					f.append($("<label>", {for: "form-modal-" + 1, class: "col-form-label"}).text(formRow.label));
					f.append($("<textarea>", basicMap));
				}
			});

			let $modal = ($("<div>", {class: "modal fade", tabindex: "-1", role: "dialog", "aria-hidden": "true"}));
			$modal
				.append($("<div>", {class: "modal-dialog"})
					.append($("<div>", {class: "modal-content"})
						.append($("<div>", {class: "modal-header"})
							.append($("<h5>", {class: "modal-title"}).text(title))
							.append($("<button>", {class: "close", "data-dismiss": "modal", "aria-label": "close"})
								.append($("<span>", {"aria-hidden": "true"}).html("&times;"))
							)
						)
						.append(f)
						.append($("<div>", {class: "modal-footer"})
							.append($("<button>", {class: "btn btn-success", type: "button"}).text(successText))
							.append($("<button>", {class: "btn btn-danger btn-cancel", type: "button"}).text("Cancel"))
						)
					)
				);

			$modal.on("click", ".btn-cancel", () =>{
				$modal.modal("hide");
			}).on("click", ".btn-success", () =>{
				let vals = [];
				$modal.find("input", "textarea", "select").each((i, v) =>{
					v = $(v);
					if(v.tagName === "SELECT"){
						vals.push(v.find(":selected").val());
					}
					else{
						vals.push(v.val());
					}
				});
				successCb($modal, vals);
			}).on("hidden.bs.modal", () =>{
				$modal.remove();
			}).modal("show");
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
