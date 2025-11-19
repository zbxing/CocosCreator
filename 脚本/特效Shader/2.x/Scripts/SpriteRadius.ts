/**
 * 自定义圆角Sprite
 */

const { ccclass, property, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
export default class SpriteRadius extends cc.Sprite {

    @property
    private _radius: number = 0;
    @property({ type: cc.Integer, tooltip: "圆角半径" })
    set radius(v: number) {
        this._radius = v;
        this.updateRadius();
    }
    get radius() {
        return this._radius;
    }

    @property({ type: [cc.Material], tooltip: "圆角材质", override: true })
    set materials(v: cc.Material[]) {
        (this as any)._materials = v;
        (this as any)._materials.forEach(mat => {
            mat && this.setMaterial(0, mat);
        });
        this.updateRadius();
    }
    get materials() {
        return (this as any)._materials;
    }

    
    onLoad() {
        this.node.on(cc.Node.EventType.SIZE_CHANGED, this.updateRadius, this);
        this.updateRadius();
    }

    /**
     * 更新圆角半径
     */
    private updateRadius() {
        let node = this.node;
        let radiusInPx = this.radius;
        node.getComponents(cc.RenderComponent).forEach(renderComponent => {
                // 计算半径px分别相对于纹理宽高的比例（也叫归一化）
                let xRadiux = radiusInPx / node.width;
                // 约束范围在区间 [0.0, 0.5]
                xRadiux = xRadiux >= 0.5 ? 0.5 : xRadiux;

                let yRadius = radiusInPx / node.height;
                yRadius = yRadius >= 0.5 ? 0.5 : yRadius;

                if (node.name === "Rectangle1") cc.log(`${node.name} : (${xRadiux}, ${yRadius})`);

                // 更新材质
                let material: cc.Material = renderComponent.getMaterial(0);

                // 圆角x轴半径长度（相对于纹理宽度）[0.0, 0.5]
                material.setProperty("xRadius", xRadiux);

                // 圆角y轴半径长度（相对于纹理高度）[0.0, 0.5]
                material.setProperty("yRadius", yRadius);
                renderComponent.setMaterial(0, material);
            });
    }
}
