/**
 * 自定义点光Sprite
 */

const { ccclass, property, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
export default class SpritePointLight extends cc.Sprite {

    private _spreadColor: cc.Color = new cc.Color(0, 0, 0, 255);
    @property({ type: cc.Color, tooltip: "扩散颜色" })
    set spreadColor(v: cc.Color) {
        this._spreadColor = v;
        this.updatePointLight();
    }
    get spreadColor() {
        return this._spreadColor;
    }

    private _pointPosition: cc.Vec2 = cc.v2(0, 0);
    @property({ type: cc.Vec2, tooltip: "扩散起点坐标" })
    set pointPosition(v: cc.Vec2) {
        this._pointPosition = v;
        this.updatePointLight();
    }
    get pointPosition() {
        return this._pointPosition;
    }

    private _spreadRadius: number = 0.4;
    @property({ type: cc.Float, tooltip: "扩散半径", range: [0, 1], slide: true })
    set spreadRadius(v: number) {
        this._spreadRadius = v;
        this.updatePointLight();
    }
    get spreadRadius() {
        return this._spreadRadius;
    }
    
    private _cropAlpha: boolean = true;
    @property({ type: cc.Boolean, tooltip: "是否裁剪掉透明区域上的光" })
    set cropAlpha(v: boolean) {
        this._cropAlpha = v;
        this.updatePointLight();
    }
    get cropAlpha() {
        return this._cropAlpha;
    }

    private _enableFog: boolean = true;
    @property({ type: cc.Boolean, tooltip: "是否启用迷雾效果" })
    set enableFog(v: boolean) {
        this._enableFog = v;
        this.updatePointLight();
    }
    get enableFog() {
        return this._enableFog;
    }

    private _innerRadius: number = 0;
    @property({ type: cc.Float, tooltip: "中心无光效半径（0-1），中心到此半径范围内不显示光效，从此半径到扩散半径之间渐变", range: [0, 1], slide: true })
    set innerRadius(v: number) {
        this._innerRadius = cc.misc.clampf(v, 0, 1);
        this.updatePointLight();
    }
    get innerRadius() {
        return this._innerRadius;
    }

    @property({ type: [cc.Material], tooltip: "圆角材质", override: true })
    set materials(v: cc.Material[]) {
        (this as any)._materials = v;
        (this as any)._materials.forEach(mat => {
            mat && this.setMaterial(0, mat);
        });
        this.updatePointLight();
    }
    get materials() {
        return (this as any)._materials;
    }


    onLoad() {
        if (CC_EDITOR) {
            this.pointPosition = cc.v2(this.node.width / 2, this.node.height / 2);
        }
        this.node.on(cc.Node.EventType.SIZE_CHANGED, this.onNodeSizeChanged, this);
        this.updatePointLight();
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.SIZE_CHANGED, this.onNodeSizeChanged, this);
    }

    private onNodeSizeChanged() {
        this.updatePointLight();
    }

    /**
     * 更新点光扩散材质参数
     */
    private updatePointLight() {
        let node = this.node;
        let spreadColor = this.spreadColor;
        node.getComponents(cc.RenderComponent).forEach(renderComponent => {
            // 更新材质
            let material: cc.Material = renderComponent.getMaterial(0);
            material.setProperty('centerColor', new cc.Vec4(spreadColor.r / 255, spreadColor.g / 255, spreadColor.b / 255, spreadColor.a / 255));
            material.setProperty('centerPoint', cc.v2(this.pointPosition.x / this.node.width, this.pointPosition.y / this.node.height));
            material.setProperty('radius', this.spreadRadius);
            material.setProperty('nodeAspect', this.node.width / Math.max(this.node.height, 0.0001));
            material.setProperty('innerRadius', this.innerRadius * this.spreadRadius);
            material.setProperty('cropAlpha', this.cropAlpha ? 1 : 0);
            material.setProperty('enableFog', this.enableFog ? 1 : 0);
            renderComponent.setMaterial(0, material);
        });
    }
}
