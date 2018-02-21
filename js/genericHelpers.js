define(["jquery"], ($) => {
	let self = {
		datasetToArray: (ds, key) => {
			let r = [];
			ds.forEach((v) => {
				r.push(v[key]);
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
				if({}.hasOwnProperty.call(map, i)){
					r.push(map[i]);
				}
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

		showSimpleModal: (title, body) => {
			self.showFormModal(null, title, null, [{type: "html", initialValue: body}], null, false);
		},

		makeFormModal: (title, successText, form, footer = true) => {
			let f = $("<div>", {class: "modal-body form-group"});
			form.forEach((formRow, i) => {
				if(!("initialValue" in formRow)){
					formRow.initialValue = "";
				}

				let id = "form-modal-" + i;
				if("id" in formRow && formRow.id !== "" && formRow.id !== null && typeof formRow.id === "string"){
					id = formRow.id;
				}

				let basicMap = {class: "form-control", id: id, value: formRow.initialValue};

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
				else if(formRow.type === "button"){
					f.append($("<label>", {for: id, class: "col-form-label"}).text(formRow.label));
					if("clickDismiss" in formRow && formRow.clickDismiss === true){
						basicMap.class += " btn-dismiss";
					}
					f.append($("<button>", basicMap).text(formRow.initialValue));
				}
				else if(formRow.type === "numeric"){
					f.append($("<label>", {for: id, class: "col-form-label"}).text(formRow.label));
					basicMap.type = "number";
					f.append($("<input>", basicMap).on("blur validate", (e) => {
						generalValidator(e, parseFloat);
					}));
				}
				else if(formRow.type === "text"){
					f.append($("<label>", {for: id, class: "col-form-label"}).text(formRow.label));
					basicMap.type = "text";
					f.append($("<input>", basicMap).on("blur validate", generalValidator));
				}
				else if(formRow.type === "file"){
					f.append($("<label>", {for: id, class: "col-form-label"}).text(formRow.label));
					basicMap.type = "file";
					basicMap.class = "form-control-file form-control";
					f.append($("<input>", basicMap).on("blur validate", generalValidator));
				}
				else if(formRow.type === "textarea"){
					f.append($("<label>", {for: id, class: "col-form-label"}).text(formRow.label));
					let $b = $("<textarea>", basicMap).on("blur validate", generalValidator);
					if("onclick" in formRow){
						$b.on("click", formRow.onclick);
					}
					f.append($b);
				}
				else if(formRow.type === "checkbox"){
					basicMap.type = "checkbox";
					basicMap.class = "form-check-input";
					delete basicMap.value;
					if(formRow.initialValue){
						basicMap.checked = "";
					}

					f.append($("<div>", {class: "form-check"})
						.append($("<label>", {for: id, class: "form-check-label"}).text(formRow.label)
							.prepend($("<input>", basicMap))
						)
					);
				}
				else if(formRow.type === "select"){
					f.append($("<label>", {for: id, class: "col-form-label"}).text(formRow.label));
					let $options = $("<select>", basicMap);
					formRow.optionText.forEach((oText, oIndex) => {
						if(oIndex < formRow.optionValues.length){
							$options.append($("<option>", {value: formRow.optionValues[oIndex]}).text(oText));
						}
						else{
							$options.append($("<option>").text(oText));
						}
					});
					f.append($options.on("blur validate", generalValidator));
				}
			});

			let $footer = $("<div>", {class: "modal-footer"})
				.append($("<button>", {class: "btn btn-success", type: "button"}).text(successText))
				.append($("<button>", {class: "btn btn-danger btn-cancel", type: "button"}).text("Cancel"));

			if(footer === false){
				$footer = null;
			}

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
						.append($footer)
					)
				);
			$modal.find("input, textarea").off("keyup").on("keyup", (e) => {
				if(e.key === "Enter"){
					$(".btn-success").last().click();
				}
			});
			$modal.on("shown.bs.modal", () => {
				$modal.find("input[type='text'], input[type='number'], textarea").first().focus();
			});

			return $modal;
		},

		showFormModal: (successCb, title, successText, form, cancelCb = ($modal) => {
			$modal.modal("hide");
		}, footer = true) => {
			let $modal = self.makeFormModal(title, successText, form, footer);

			$modal.on("click", ".btn-cancel", () => {
				if(typeof cancelCb === "function"){
					cancelCb($modal);
				}
				else{
					$modal.modal("hide");
				}
			}).on("click", ".btn-dismiss", () => {
				$modal.modal("hide");
			}).on("click", ".btn-success", () => {
				let vals = [];
				let hasErrors = false;

				$modal.find("input, textarea, select").each((i, v) => {
					let $v = $(v);

					if($v.tagName === "SELECT"){
						vals.push($v.find(":selected").val());
					}
					else if($v.attr("type") === "checkbox"){
						vals.push($v.prop("checked"));
					}
					else if($v.attr("type") === "file"){
						vals.push($v.get(0).files);
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

				if(!hasErrors && typeof successCb === "function"){
					successCb($modal, vals);
				}
			}).on("hidden.bs.modal", () => {
				$modal.remove();
			}).modal("show");
		}
	};

	return self;
});
