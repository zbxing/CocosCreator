/**
 * 自定义马赛克Sprite
 */

const { ccclass, property, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
export default class SpriteMosaic extends cc.Sprite {

    private _blockCount: number = 10;
    @property({ type: cc.Integer, tooltip: "马赛克XY轴方块数量" })
    set blockCount(v: number) {
        this._blockCount = v;
        this.updateMosaic();
    }
    get blockCount() {
        return this._blockCount;
    }

    private _enable: boolean = true;
    @property({ type: cc.Boolean, tooltip: "是否启用马赛克" })
    set enable(v: boolean) {
        this._enable = v;
        this.updateMosaic();
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
        this.updateMosaic();
    }
    get materials() {
        return (this as any)._materials;
    }


    onLoad() {
        this.updateMosaic();
    }

    /**
     * 更新马赛克
     */
    private updateMosaic() {
        let node = this.node;
        node.getComponents(cc.RenderComponent).forEach(renderComponent => {
            // 更新材质
            let material: cc.Material = renderComponent.getMaterial(0);
            material.setProperty('xBlockCount', this.blockCount);
            material.setProperty('yBlockCount', this.blockCount);
            material.setProperty('mosaicSwitch', this.enable ? 1 : 0);
            renderComponent.setMaterial(0, material);
        });
    }
}
