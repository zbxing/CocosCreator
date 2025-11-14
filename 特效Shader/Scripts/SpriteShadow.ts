/**
 * 自定义阴影Sprite
 */

const { ccclass, property, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
export default class SpriteShadow extends cc.Sprite {

    private _shadowColor: cc.Color = new cc.Color(0, 0, 0, 255 * 0.5);
    @property({ type: cc.Color, tooltip: "描边颜色" })
    set shadowColor(v: cc.Color) {
        this._shadowColor = v;
        this.updateShadow();
    }
    get shadowColor() {
        return this._shadowColor;
    }

    private _shadowOffset: cc.Vec2 = cc.v2(-0.02, -0.06);
    @property({ type: cc.Vec2, tooltip: "阴影偏移" })
    set shadowOffset(v: cc.Vec2) {
        this._shadowOffset = v;
        this.updateShadow();
    }
    get shadowOffset() {
        return this._shadowOffset;
    }

    @property({ type: [cc.Material], tooltip: "材质", override: true })
    set materials(v: cc.Material[]) {
        (this as any)._materials = v;
        (this as any)._materials.forEach(mat => {
            mat && this.setMaterial(0, mat);
        });
        this.updateShadow();
    }
    get materials() {
        return (this as any)._materials;
    }

    
    onLoad() {
        this.updateShadow();
    }

    /**
     * 更新阴影
     */
    private updateShadow() {
        let node = this.node;
        let shadowColor = this.shadowColor;
        node.getComponents(cc.RenderComponent).forEach(renderComponent => {
                // 更新材质
                let material: cc.Material = renderComponent.getMaterial(0);
                material.setProperty('shadowColor', new cc.Vec4(shadowColor.r / 255, shadowColor.g / 255, shadowColor.b / 255, shadowColor.a / 255));
                material.setProperty('shadowOffset', this.shadowOffset);
                // material.setProperty('isWhite', -1.0);
                renderComponent.setMaterial(0, material);
            });
    }
}
