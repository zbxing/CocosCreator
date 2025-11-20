/**
 * 自定义老照片特效Sprite
 */

const { ccclass, property, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
export default class SpriteMosaic extends cc.Sprite {

    private _oldLevel: number = 1.0;
    @property({ type: cc.Float, tooltip: "老照片特效强度", range: [0.0, 1.0], slide: true })
    set oldLevel(v: number) {
        this._oldLevel = v;
        this.updateOldPhoto();
    }
    get oldLevel() {
        return this._oldLevel;
    }

    private _enable: boolean = true;
    @property({ type: cc.Boolean, tooltip: "是否启用老照片特效" })
    set enable(v: boolean) {
        this._enable = v;
        this.updateOldPhoto();
    }
    get enable() {
        return this._enable;
    }

    @property({ type: [cc.Material], tooltip: "圆角材质", override: true })
    set materials(v: cc.Material[]) {
        (this as any)._materials = v;
        (this as any)._materials.forEach(mat => {
            mat && this.setMaterial(0, mat);
        });
        this.updateOldPhoto();
    }
    get materials() {
        return (this as any)._materials;
    }


    onLoad() {
        this.updateOldPhoto();
    }

    /**
     * 更新老照片特效
     */
    private updateOldPhoto() {
        let node = this.node;
        node.getComponents(cc.RenderComponent).forEach(renderComponent => {
            // 更新材质
            let material: cc.Material = renderComponent.getMaterial(0);
            material.setProperty('oldLevel', this.oldLevel);
            material.setProperty('enableOldPhoto', this.enable ? 1 : 0);
            renderComponent.setMaterial(0, material);
        });
    }
}
