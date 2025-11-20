/**
 * 自定义闪光Sprite
 */

const { ccclass, property, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
export default class SpriteFlashLight extends cc.Sprite {

    @property
    private _flashLightColor: cc.Color = new cc.Color(255, 245, 0, 255);
    @property({ type: cc.Color, tooltip: "光束颜色" })
    set flashLightColor(v: cc.Color) {
        this._flashLightColor = v;
        this.updateFlashLight();
    }
    get flashLightColor() {
        return this._flashLightColor;
    }

    private _lightCenterPoint: cc.Vec2 = cc.v2(0, 0);
    @property({ type: cc.Vec2, tooltip: "光束中心点坐标" })
    set lightCenterPoint(v: cc.Vec2) {
        this._lightCenterPoint = v;
        this.updateFlashLight();
    }
    get lightCenterPoint() {
        return this._lightCenterPoint;
    }

    private _lightAngle: number = 36.0;
    @property({ type: cc.Float, tooltip: "光束倾斜角度（0-360度）", range: [0, 360], slide: true })
    set lightAngle(v: number) {
        this._lightAngle = cc.misc.clampf(v, 0, 360);
        this.updateFlashLight();
    }
    get lightAngle() {
        return this._lightAngle;
    }

    private _lightWidth: number = 0.2;
    @property({ type: cc.Float, tooltip: "光束宽度（0-1）", range: [0, 1], slide: true })
    set lightWidth(v: number) {
        this._lightWidth = cc.misc.clampf(v, 0, 1);
        this.updateFlashLight();
    }
    get lightWidth() {
        return this._lightWidth;
    }

    private _enableGradient: boolean = true;
    @property({ type: cc.Boolean, tooltip: "是否启用光束渐变" })
    set enableGradient(v: boolean) {
        this._enableGradient = v;
        this.updateFlashLight();
    }
    get enableGradient() {
        return this._enableGradient;
    }

    private _cropAlpha: boolean = true;
    @property({ type: cc.Boolean, tooltip: "是否裁剪掉透明区域上的光" })
    set cropAlpha(v: boolean) {
        this._cropAlpha = v;
        this.updateFlashLight();
    }
    get cropAlpha() {
        return this._cropAlpha;
    }

    private _enableFog: boolean = false;
    @property({ type: cc.Boolean, tooltip: "是否启用迷雾效果" })
    set enableFog(v: boolean) {
        this._enableFog = v;
        this.updateFlashLight();
    }
    get enableFog() {
        return this._enableFog;
    }

    private _enable: boolean = true;
    @property({ type: cc.Boolean, tooltip: "是否启用闪光" })
    set enable(v: boolean) {
        this._enable = v;
        this.updateFlashLight();
    }
    get enable() {
        return this._enable;
    }

    @property({ type: [cc.Material], tooltip: "闪光材质", override: true })
    set materials(v: cc.Material[]) {
        (this as any)._materials = v;
        (this as any)._materials.forEach(mat => {
            mat && this.setMaterial(0, mat);
        });
        this.updateFlashLight();
    }
    get materials() {
        return (this as any)._materials;
    }

    
    onLoad() {
        if (CC_EDITOR) {
            this.lightCenterPoint = cc.v2(this.node.width / 2, this.node.height / 2);
        }
        this.node.on(cc.Node.EventType.SIZE_CHANGED, this.onNodeSizeChanged, this);
        this.updateFlashLight();
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.SIZE_CHANGED, this.onNodeSizeChanged, this);
    }

    private onNodeSizeChanged() {
        this.updateFlashLight();
    }

    /**
     * 更新闪光材质参数
     */
    private updateFlashLight() {
        let node = this.node;
        let flashLightColor = this.flashLightColor;
        node.getComponents(cc.RenderComponent).forEach(renderComponent => {
            // 更新材质
            let material: cc.Material = renderComponent.getMaterial(0);
            material.setProperty('lightColor', new cc.Vec4(flashLightColor.r / 255, flashLightColor.g / 255, flashLightColor.b / 255, flashLightColor.a / 255));
            material.setProperty('lightCenterPoint', cc.v2(this.lightCenterPoint.x / this.node.width, this.lightCenterPoint.y / this.node.height));
            material.setProperty('lightAngle', this.lightAngle);
            material.setProperty('lightWidth', this.lightWidth);
            material.setProperty('enableGradient', this.enableGradient ? 1 : 0);
            material.setProperty('cropAlpha', this.cropAlpha ? 1 : 0);
            material.setProperty('enableFog', this.enableFog ? 1 : 0);
            material.setProperty('enableFlashLight', this.enable ? 1 : 0);
            renderComponent.setMaterial(0, material);
        });
    }
}
