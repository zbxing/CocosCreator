/** 
 * ScrollView Locator, used to locate the position of the ScrollView's content
 * ScrollView 定位器，用于定位 ScrollView 内容的位置
 */

const { ccclass, property, requireComponent } = cc._decorator;

/** 固定位置枚举 */
export enum LocatorPosition {
    Top,
    Bottom,
    Left,
    Right,
    Center,
}

@ccclass
@requireComponent(cc.ScrollView)
export default class ScrollViewLocator extends cc.Component {

    @property({ type: cc.Enum(LocatorPosition), tooltip: "固定位置" })
    position: LocatorPosition = LocatorPosition.Center;

    @property
    private _offset: cc.Vec2 = cc.v2(0, 0);
    @property({ type: cc.Vec2, tooltip: "位置偏移量" })
    set offset(v: cc.Vec2) {
        this._offset = v;
    }
    get offset() {
        return this._offset;
    }
    
    private slv: cc.ScrollView;
    private prevNode: cc.Node;


    /**
     * @description 生命周期回调，缓存 ScrollView 组件引用
     */
    onLoad() {
        this.slv = this.node.getComponent(cc.ScrollView);
        if (!cc.isValid(this.slv)) return;
    }

    /**
     * @description 通过节点更新位置
     * @param node 节点
     * @param timeInSecond 动画时间
     */
    /**
     * @description 将指定节点滚动到 ScrollView 视图中的目标位置
     * @param node 需要定位的节点
     * @param timeInSecond 动画时间，默认 0.5 秒
     */
    public updatePosByNode(node: cc.Node, timeInSecond: number = 0.5) {
        if (!cc.isValid(node)) return;
        if (!this.ensureScrollView()) return;
        const content = this.slv.content;
        if (!cc.isValid(content)) return;
        if (!this.isDescendantOfContent(node)) return;
        if (this.prevNode == node) return;

        const targetWorldPos = this.getViewReferenceWorldPosition(this.position);
        const nodeWorldPos = this.getNodeReferenceWorldPosition(node, this.position);
        const delta = cc.v2(targetWorldPos.x - nodeWorldPos.x, targetWorldPos.y - nodeWorldPos.y);
        const currentOffset = this.slv.getScrollOffset();
        const desiredOffset = cc.v2(
            currentOffset.x - delta.x,
            currentOffset.y + delta.y,
        );
        const clamped = this.clampOffset(desiredOffset);
        const duration = Math.max(timeInSecond, 0);
        this.prevNode = node;
        this.slv.stopAutoScroll();
        this.slv.scrollToOffset(clamped, duration, true);
    }

    /**
     * @description 通过索引更新位置
     * @param index 索引
     * @param timeInSecond 动画时间
     */
    /**
     * @description 根据索引定位 ScrollView content 的子节点
     * @param index 子节点索引
     * @param timeInSecond 动画时间
     */
    public updatePosByIndex(index: number, timeInSecond: number = 0.5) {
        if (!this.ensureScrollView()) return;
        const content = this.slv.content;
        if (!cc.isValid(content)) return;
        const children = content.children;
        if (!children?.length) return;
        if (index < 0 || index >= children.length) return;
        this.updatePosByNode(children[index], timeInSecond);
    }

    /**
     * @description 确保 ScrollView 引用有效，必要时重新获取
     */
    private ensureScrollView(): boolean {
        if (!cc.isValid(this.slv)) {
            this.slv = this.node.getComponent(cc.ScrollView);
        }
        return cc.isValid(this.slv);
    }

    /**
     * @description 判断节点是否属于当前 ScrollView content
     * @param node 待检测节点
     */
    private isDescendantOfContent(node: cc.Node): boolean {
        const content = this.slv.content;
        if (!cc.isValid(content)) return false;
        let current: cc.Node = node;
        while (cc.isValid(current)) {
            if (current === content) return true;
            current = current.parent;
        }
        return false;
    }

    /**
     * @description 获取 ScrollView 视图中参考位置的世界坐标
     * @param position 固定位置枚举
     */
    private getViewReferenceWorldPosition(position: LocatorPosition): cc.Vec3 {
        const view = this.slv.node;
        const localPoint = this.getReferencePoint(view, position);
        localPoint.x += this.offset.x;
        localPoint.y += this.offset.y;
        return view.convertToWorldSpaceAR(cc.v3(localPoint.x, localPoint.y, 0));
    }

    /**
     * @description 获取节点参考位置的世界坐标
     * @param node 目标节点
     * @param position 固定位置
     */
    private getNodeReferenceWorldPosition(node: cc.Node, position: LocatorPosition): cc.Vec3 {
        const localPoint = this.getReferencePoint(node, position);
        return node.convertToWorldSpaceAR(cc.v3(localPoint.x, localPoint.y, 0));
    }

    /**
     * @description 根据位置枚举返回节点局部参考坐标
     * @param target 目标节点
     * @param position 固定位置
     */
    private getReferencePoint(target: cc.Node, position: LocatorPosition): cc.Vec2 {
        const size = target.getContentSize();
        const anchor = target.getAnchorPoint();
        const left = -anchor.x * size.width;
        const right = (1 - anchor.x) * size.width;
        const bottom = -anchor.y * size.height;
        const top = (1 - anchor.y) * size.height;

        const centerX = (0.5 - anchor.x) * size.width;
        const centerY = (0.5 - anchor.y) * size.height;

        switch (position) {
            case LocatorPosition.Top:
                return cc.v2(0, top);
            case LocatorPosition.Bottom:
                return cc.v2(0, bottom);
            case LocatorPosition.Left:
                return cc.v2(left, 0);
            case LocatorPosition.Right:
                return cc.v2(right, 0);
            case LocatorPosition.Center:
            default:
                return cc.v2(centerX, centerY);
        }
    }

    /**
     * @description 将偏移量限制在 ScrollView 可滚动范围内
     * @param offset 目标偏移
     */
    private clampOffset(offset: cc.Vec2): cc.Vec2 {
        const maxOffset = this.slv.getMaxScrollOffset();
        const result = offset.clone();

        if (!this.slv.horizontal || maxOffset.x <= 0) {
            result.x = 0;
        } else {
            result.x = cc.misc.clampf(result.x, 0, maxOffset.x);
        }

        if (!this.slv.vertical || maxOffset.y <= 0) {
            result.y = 0;
        } else {
            result.y = cc.misc.clampf(result.y, 0, maxOffset.y);
        }

        return result;
    }
}
