import EN_US from "src/EN_US";

export enum Languages {
    EN_US = "EN_US",

}

export let current = {} as typeof EN_US;


export const setLanguage = async () => {
    current = (await import(`../${window.settings.getOption("language") || Languages.EN_US}.ts`)).default;
};
