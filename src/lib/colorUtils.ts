

export function getPicoColors(styleDeclaration: CSSStyleDeclaration) {
    const primary = styleDeclaration.getPropertyValue('--pico-primary').trim();
    const secondary = styleDeclaration.getPropertyValue('--pico-secondary').trim();
    const contrast = styleDeclaration.getPropertyValue('--pico-contrast').trim();
    const contrastInverse = styleDeclaration.getPropertyValue('--pico-contrast-inverse').trim();
    const primaryColor = styleDeclaration.getPropertyValue('--pico-color').trim();
    const secondaryColor = styleDeclaration.getPropertyValue('--pico-contrast-inverse').trim();


    const primaryBg = styleDeclaration.getPropertyValue('--pico-primary-background').trim();

    const secondaryBg = styleDeclaration.getPropertyValue('--pico-secondary-background').trim();

    const colors = {
        primary: primary,
        secondary: secondary,
        primaryColor: primaryColor,
        secondaryColor: secondaryColor,
        primaryBg: primaryBg,
        secondaryBg: secondaryBg,
        contrast: contrast,
        contrastInverse: contrastInverse
    };

    return colors;

}