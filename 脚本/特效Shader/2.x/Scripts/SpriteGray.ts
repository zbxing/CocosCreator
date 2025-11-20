/**
 * 自定义圆角Sprite
 */

const { ccclass, property, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
export default class SpriteGray extends cc.Sprite {

    @property
    private _grayPercent: number = 1.0;
    @property({ type: cc.Float, tooltip: "灰化比例", range: [0, 1], slide: true })
    set grayPercent(v: number) {
        this._grayPercent = v;
        this.updateGray();
    }
    get grayPercent() {
        return this._grayPercent;
    }

    private _enable: boolean = true;
    @property({ type: cc.Boolean, tooltip: "是否启用灰化" })
    set enable(v: boolean) {
        this._enable = v;
        this.updateGray();
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
        this.updateGray();
    }
    get materials() {
        return (this as any)._materials;
    }

    
    onLoad() {
        this.updateGray();
    }

    /**
     * 更新灰化
     */
    private updateGray() {
        let node = this.node;
        let grayPercent = this.grayPercent;
        node.getComponents(cc.RenderComponent).forEach(renderComponent => {
                // 更新材质
                let material: cc.Material = renderComponent.getMaterial(0);
                material.setProperty("grayLevel", grayPercent);
                material.setProperty('enableGray', this.enable ? 1 : 0)
                renderComponent.setMaterial(0, material);
            });
    }
}
