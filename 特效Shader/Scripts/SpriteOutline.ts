/**
 * 自定义描边Sprite
 */

const { ccclass, property, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
export default class SpriteOutline extends cc.Sprite {

    private _outlineColor: cc.Color = new cc.Color(255, 255, 255, 255);
    @property({ type: cc.Color, tooltip: "描边颜色" })
    set outlineColor(v: cc.Color) {
        this._outlineColor = v;
        Editor.log("outlineColor 颜色", v);
        this.updateOutline();
    }
    get outlineColor() {
        return this._outlineColor;
    }

    private _outlineWidth: number = 1.0;
    @property({ type: cc.Float, tooltip: "描边宽度" })
    set outlineWidth(v: number) {
        Editor.log("outlineWidth 宽度", v);
        this._outlineWidth = v;
        this.updateOutline();
    }
    get outlineWidth() {
        return this._outlineWidth;
    }

    @property({ type: [cc.Material], tooltip: "圆角材质", override: true })
    set materials(v: cc.Material[]) {
        (this as any)._materials = v;
        (this as any)._materials.forEach(mat => {
            mat && this.setMaterial(0, mat);
        });
        this.updateOutline();
    }
    get materials() {
        return (this as any)._materials;
    }

    
    onLoad() {
        this.updateOutline();
    }

    /**
     * 更新灰化
     */
    private updateOutline() {
        let node = this.node;
        let outlineColor = this.outlineColor;
        node.getComponents(cc.RenderComponent).forEach(renderComponent => {
                // 更新材质
                let material: cc.Material = renderComponent.getMaterial(0);
                material.setProperty('outlineColor', new cc.Vec4(outlineColor.r / 255, outlineColor.g / 255, outlineColor.b / 255, outlineColor.a / 255));
                material.setProperty('textureSize', cc.v2(this.node.width, this.node.height));
                material.setProperty('outlineSize', this.outlineWidth);
                renderComponent.setMaterial(0, material);
            });
    }
}
