define(["jquery"], ($) => {
	let self = {
		datasetToArray: (ds, key) => {
			let r = [];
			ds.forEach((v) => {
				r.push(v[key]);
			});
			return r;
		},

		datasetToArrayMap: (ds) => {
			let r = [];
			ds.forEach((v) => {
				r.push(v);
			});
			return r;
		},

		keepOnlyKeys: (arr, keys) => {
			arr = arr.slice();
			arr.forEach((v) => {
				let k = Object.keys(v);
				k.forEach((key) => {
					if(keys.indexOf(key) < 0){
						delete v[key];
					}
				});
			});
			return arr;
		},

		getFileExtension: (filename) => {
			return filename.split(".").splice(-1)[0];
		},

		htmlEncode: (string) => {
			string = $("<div>").text(string).html();
			string = string.replace(/(?:\r\n|\r|\n)/g, '<br/>');
			return string;
		},

		printout: (text, escape) => {
			if(escape){
				text = this.htmlEncode(escape);
			}
			$("#printout").html(text);
		},

		flatten: (map) => {
			let r = [];
			for(let i in map){
				r.push(map[i]);
			}
			return r;
		},

		rotate: (map) => {
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

		max: (iterable) => {
			return iterable.reduce((a, b) => {
				return Math.max(a, b);
			});
		},

		toTitleCase: (str) => {
			return str.replace(/(?:^|\s)\w/g, (match) => {
				return match.toUpperCase();
			});
		},

		showErrorModal: (title, body) => {
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
			$modal.on("hidden.bs.modal", () => {
				$modal.remove();
			});
			$modal.modal("show");
		},

		makeFormModal: (title, successText, form) => {
			let f = $("<div>", {class: "modal-body form-group"});
			form.forEach((formRow, i) => {
				if(!("initialValue" in formRow)){
					formRow.initialValue = "";
				}
				let basicMap = {class: "form-control", id: "form-modal-" + i, value: formRow.initialValue};

				if("extraAttrs" in formRow){
					for(let attrname in formRow.extraAttrs){
						basicMap[attrname] = formRow.extraAttrs[attrname];
					}
				}

				let validFunc = () => true;
				if("validationFunc" in formRow){
					validFunc = formRow.validationFunc;
				}

				let generalValidator = (event, valueMutator = null) => {
					let $v = $(event.target);
					let val = $v.val();
					if(valueMutator !== null && typeof valueMutator === "function"){
						val = valueMutator(val);
					}
					let valid = validFunc(val, $v);

					if(valid === true){
						$v.removeClass("is-invalid").next("#feedback-" + i).remove();
					}
					else{
						$v.addClass("is-invalid");
						if($v.next("#feedback-" + i).length === 0){
							$v.after($("<div>", {class: "invalid-feedback", id: "feedback-" + i}).text(valid));
						}
					}
				};

				if(formRow.type === "html"){
					f.append($(formRow.initialValue));
				}
				else if(formRow.type === "numeric"){
					f.append($("<label>", {for: "form-modal-" + i, class: "col-form-label"}).text(formRow.label));
					basicMap.type = "number";
					f.append($("<input>", basicMap).on("blur validate", (e) => {
						generalValidator(e, parseFloat);
					}));
				}
				else if(formRow.type === "text"){
					f.append($("<label>", {for: "form-modal-" + i, class: "col-form-label"}).text(formRow.label));
					basicMap.type = "text";
					f.append($("<input>", basicMap).on("blur validate", generalValidator));
				}
				else if(formRow.type === "textarea"){
					f.append($("<label>", {for: "form-modal-" + i, class: "col-form-label"}).text(formRow.label));
					f.append($("<textarea>", basicMap).on("blur validate", generalValidator));
				}
				else if(formRow.type === "checkbox"){
					basicMap.type = "checkbox";
					basicMap.class = "form-check-input";
					delete basicMap.value;
					if(formRow.initialValue){
						basicMap.checked = null;
					}

					f.append($("<div>", {class: "form-check"})
						.append($("<label>",
							{for: "form-modal-" + i, class: "form-check-label"})
							.text(formRow.label).prepend($("<input>", basicMap))
						)
					);
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
			$modal.find("input, textarea").off("keyup").on("keyup", (e) => {
				if(e.key === "Enter"){
					$(".btn-success").last().click();
				}
			});
			$modal.on("shown.bs.modal", () => {
				$modal.find("input, textarea, select").first().focus();
			});

			return $modal;
		},

		showFormModal: (successCb, title, successText, form, cancelCb = ($modal) => {
			$modal.modal("hide");
		}) => {
			let $modal = self.makeFormModal(title, successText, form);

			$modal.on("click", ".btn-cancel", () => {
				cancelCb($modal);
			}).on("click", ".btn-success", () => {
				let vals = [];
				let hasErrors = false;

				$modal.find("input", "textarea", "select").each((i, v) => {
					let $v = $(v);

					if($v.tagName === "SELECT"){
						vals.push($v.find(":selected").val());
					}
					if($v.attr("type") === "checkbox"){
						vals.push($v.prop("checked"));
					}
					else if($v.attr("type") === "number"){
						vals.push(parseFloat($v.val()));
					}
					else{
						vals.push($v.val());
					}

					if($v.trigger("validate").hasClass("is-invalid")){
						hasErrors = true;
					}

				});

				if(!hasErrors){
					successCb($modal, vals);
				}
			}).on("hidden.bs.modal", () => {
				$modal.remove();
			}).modal("show");
		},

		equalsObject: (obj1, obj2) => {
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

	return self;
});
