"use strict";

import * as $ from 'jquery';

declare interface ModalFormRow {
    type: string;
    label?: string;
    initialValue?: any;
    id?: string | number;
    extraAttrs?: any;
    validationFunc?: (value?: any, container?: JQuery) => boolean | string;
    clickDismiss?: boolean;
    onclick?: (...args: any[]) => void;
    optionText?: any[];
    optionValues?: any[];
}

declare interface BasicMapType {
    class: string;
    id: string;
    value: any,

    [key: number]: any,

    [key: string]: any
}

const defaultCancelCb = ($modal) => {
    $modal.modal("hide");
};

const self = {
    deepFreeze: <T>(o: T): Readonly<T> => {
        Object.freeze(o);

        Object.getOwnPropertyNames(o).forEach((prop: string | number) => {
            if (o.hasOwnProperty(prop) && (o as any)[prop] !== null
                && (typeof (o as any)[prop] === "object" || typeof (o as any)[prop] === "function")
                && !Object.isFrozen((o as any)[prop])) {
                self.deepFreeze((o as any)[prop]);
            }
        });

        return o;
    },

    sort: <T>(arr: T[], compareFunction: (a: any, b: any) => number): T[] => {
        return [...arr].sort(compareFunction);
    },

    datasetToArray: (ds: any, key: string): Readonly<any[]> => {
        const r: any[] = [];
        ds.forEach((v) => {
            r.push(v[key]);
        });
        return self.deepFreeze(r);
    },

    keepOnlyKeys: <T>(arr: T[], keys: string[]): Readonly<T[]> => {
        arr = arr.slice();
        arr.forEach((v: any) => {
            const k = Object.keys(v);
            k.forEach((key) => {
                if (keys.indexOf(key) < 0) {
                    delete v[key];
                }
            });
        });
        return self.deepFreeze(arr);
    },

    getFileExtension: (filename: string): string => {
        return filename.split(".").splice(-1)[0];
    },

    htmlEncode: (string: string): string => {
        string = $("<div>").text(string).html();
        string = string.replace(/(?:\r\n|\r|\n)/g, '<br/>');
        return string;
    },

    printout: (text: string, escape?: string): void => {
        if (escape) {
            text = this.htmlEncode(escape);
        }
        $("#printout").html(text);
    },

    flatten: <T>(map: { [key: string]: T }): Readonly<T[]> => {
        const r: T[] = [];
        Object.keys(map).forEach((i) => {
            r.push(map[i]);
        });
        return self.deepFreeze(r);
    },

    rotate: (map: any): Readonly<any> => {
        const r: any = {};
        Object.keys(map).forEach((i) => {
            if (map[i] in r) {
                r[map[i]].push(i);
            }
            else {
                r[map[i]] = [i];
            }
        });
        return self.deepFreeze(r);
    },

    max: (iterable: any[]): number => {
        return iterable.reduce((a, b) => {
            return Math.max(a, b);
        });
    },

    toTitleCase: (str: string): string => {
        return str.replace(/(?:^|\s)\w/g, (match) => {
            return match.toUpperCase();
        });
    },

    showSimpleModal: (title: string, body: string): void => {
        self.showFormModal(null, title, null, [{type: "html", initialValue: body}], null, false);
    },

    makeFormModal: (title: string, successText: string, form: ModalFormRow[], footer = true): JQuery => {
        const f = $("<div>", {class: "modal-body form-group"});
        form.forEach((formRow, i) => {
            if (!("initialValue" in formRow)) {
                formRow.initialValue = "";
            }

            let id = "form-modal-" + i;
            if ("id" in formRow && formRow.id !== "" && formRow.id !== null && typeof formRow.id === "string") {
                id = formRow.id;
            }

            const basicMap: BasicMapType = {class: "form-control", id, value: formRow.initialValue};

            if ("extraAttrs" in formRow) {
                Object.keys(formRow.extraAttrs).forEach((attrname) => {
                    if (typeof formRow.extraAttrs[attrname] !== "function") {
                        basicMap[attrname] = formRow.extraAttrs[attrname];
                    }
                });
            }

            let validFunc = (value?: any, container?: JQuery): string | boolean => true;
            if ("validationFunc" in formRow) {
                validFunc = formRow.validationFunc;
            }

            const generalValidator = (event: any, valueMutator: (v: any) => any = null) => {
                const $v = $(event.target);
                let val = $v.val();
                if (valueMutator !== null && typeof valueMutator === "function") {
                    val = valueMutator(val);
                }
                const valid = validFunc(val, $v);

                if (valid === true) {
                    $v.removeClass("is-invalid").next("#feedback-" + i).remove();
                }
                else {
                    $v.addClass("is-invalid");
                    if ($v.next("#feedback-" + i).length === 0) {
                        $v.after($("<div>", {class: "invalid-feedback", id: "feedback-" + i}).text(valid));
                    }
                }
            };

            if (formRow.type === "html") {
                f.append($(formRow.initialValue));
            }
            else if (formRow.type === "checkbox") {
                basicMap.type = "checkbox";
                basicMap.class = "form-check-input";
                delete basicMap.value;
                if (formRow.initialValue) {
                    basicMap.checked = "";
                }

                f.append($("<div>", {class: "form-check"})
                    .append($("<label>", {for: id, class: "form-check-label"})
                        .text(formRow.label).prepend($("<input>", basicMap))
                    )
                );
            }
            else {
                f.append($("<label>", {for: id, class: "col-form-label"}).text(formRow.label));

                if (formRow.type === "button") {
                    if ("clickDismiss" in formRow && formRow.clickDismiss === true) {
                        basicMap.class += " btn-dismiss";
                    }
                    const $b = $("<button>", basicMap).text(formRow.initialValue);
                    if ("onclick" in formRow && typeof formRow.onclick === "function") {
                        $b.on("click", formRow.onclick);
                    }
                    f.append($b);
                }
                else if (formRow.type === "numeric") {
                    basicMap.type = "number";
                    f.append($("<input>", basicMap).on("blur validate", (e) => {
                        generalValidator(e, parseFloat);
                    }));
                }
                else if (formRow.type === "text") {
                    basicMap.type = "text";
                    f.append($("<input>", basicMap).on("blur validate", generalValidator));
                }
                else if (formRow.type === "file") {
                    basicMap.type = "file";
                    basicMap.class = "form-control-file form-control";
                    f.append($("<input>", basicMap).on("blur validate", generalValidator));
                }
                else if (formRow.type === "textarea") {
                    const $b = $("<textarea>", basicMap).on("blur validate", generalValidator);
                    if ("onclick" in formRow) {
                        $b.on("click", formRow.onclick);
                    }
                    f.append($b);
                }
                else if (formRow.type === "select") {
                    const $options = $("<select>", basicMap);
                    formRow.optionText.forEach((oText, oIndex) => {
                        if (oIndex < formRow.optionValues.length) {
                            $options.append($("<option>", {value: formRow.optionValues[oIndex]}).text(oText));
                        }
                        else {
                            $options.append($("<option>").text(oText));
                        }
                    });
                    f.append($options.on("blur validate", generalValidator));
                }
            }
        });

        let $footer = $("<div>", {class: "modal-footer"})
            .append($("<button>", {class: "btn btn-success", type: "button"}).text(successText))
            .append($("<button>", {class: "btn btn-danger btn-cancel", type: "button"}).text("Cancel"));

        if (footer === false) {
            $footer = null;
        }

        const $modal = ($("<div>", {class: "modal fade", tabindex: "-1", role: "dialog", "aria-hidden": "true"}));
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
            if (e.key === "Enter") {
                $(".btn-success").last().trigger("click");
            }
        });
        $modal.on("shown.bs.modal", () => {
            $modal.find("input[type='text'], input[type='number'], textarea").first().trigger("focus");
        });

        return $modal;
    },

    showFormModal: (successCb: ($modal: JQuery, vals: any[]) => void,
                    title: string, successText: string, form: ModalFormRow[],
                    cancelCb: ($modal: JQuery) => void = defaultCancelCb, footer = true) => {
        const $modal = self.makeFormModal(title, successText, form, footer);

        $modal.on("click", ".btn-cancel", () => {
            if (typeof cancelCb === "function") {
                cancelCb($modal);
            }
            else {
                $modal.modal("hide");
            }
        }).on("click", ".btn-dismiss", () => {
            $modal.modal("hide");
        }).on("click", ".btn-success", () => {
            const vals: any[] = [];
            let hasErrors = false;

            $modal.find("input, textarea, select").each((i, v) => {
                const $v = $(v);

                if (($v as any).tagName === "SELECT") {
                    vals.push($v.find(":selected").val());
                }
                else if ($v.attr("type") === "checkbox") {
                    vals.push($v.prop("checked"));
                }
                else if ($v.attr("type") === "file") {
                    vals.push(($v.get(0) as any).files);
                }
                else if ($v.attr("type") === "number") {
                    vals.push(parseFloat($v.val() as string));
                }
                else {
                    vals.push($v.val());
                }

                if ($v.trigger("validate").hasClass("is-invalid")) {
                    hasErrors = true;
                }

            });

            if (!hasErrors && typeof successCb === "function") {
                successCb($modal, vals);
            }
        }).on("hidden.bs.modal", () => {
            $modal.remove();
        }).modal("show");
    }
};

export default self;
