/** 
 * ScrollView Recycler, used to control the display and hiding of content nodes.
 * ScrollView 回收器，用于控制内容节点的显示和隐藏
 */

const { ccclass, property, requireComponent } = cc._decorator;

export interface IManagedNode {
    /** 节点 */
    node: cc.Node;
    /** 是否可见 */
    active: boolean;
    /** 透明度 */
    opacity: number;
    /** 相对滚动节点的Rect */
    rect: cc.Rect;
    /** 是否刷新透明度，否则刷新节点active，需要确保父节点宽高未使用Layout布局 */
    updateOpacity?: boolean;
}

@ccclass
@requireComponent(cc.ScrollView)
export default class ScrollViewRecycler extends cc.Component {

    @property({ type: cc.Integer, tooltip: "节点遍历深度" })
    depth: number = 3;

    @property
    private _interval: number = 1 / 60 * 1000;
    @property({ type: cc.Float, tooltip: "节点刷新频率" })
    set refreshInterval(v: number) {
        this._interval = Math.max(1 / 60 * 1000, v * 1000); // 最小值为0，表示不限制刷新频率
    }
    get refreshInterval() {
        return this._interval / 1000;
    }

    @property({ type: [cc.Node], tooltip: "需要强制刷新子节点的父节点集合" })
    forceUpdateParents: cc.Node[] = [];


    private lastUpdateTime: number = 0;
    private lastSlvPos: cc.Vec2 = cc.v2(0, 0);
    private otherNodes: { node: cc.Node, updateOpacity?: boolean }[] = [];
    private slv: cc.ScrollView;
    private managedNodes: IManagedNode[] = [];
    private managedOpacities: { [key: string]: number } = {};
    private slvSize: cc.Size;
    private slvRelativeTop: number = 0;
    private slvRelativeBottom: number = 0;
    private slvRelativeLeft: number = 0;
    private slvRelativeRight: number = 0;

    onLoad() {
        this.slv = this.node.getComponent(cc.ScrollView);
        if (!cc.isValid(this.slv)) return;

        // 获取ScrollView的尺寸
        this.slvSize = this.slv.node.getContentSize();
        this.slv.node.on(cc.Node.EventType.SIZE_CHANGED, () => {
            this.slvSize = this.slv.node.getContentSize();
        }, this);
        // 监听滚动节点尺寸变化
        this.slv.content.on(cc.Node.EventType.SIZE_CHANGED, () => {
            this.updateManagedNodes(); //更新管理节点数组
            this.onUpdate(true);
            this.scheduleOnce(() => this.onUpdate(true), 3 / 60);
        }, this);

        // 监听滚动节点位置变化，并刷新显示节点
        this.slv.content.on(cc.Node.EventType.POSITION_CHANGED, () => {
            this.onUpdate()
        })

        // 获取ScrollView的滚动节点坐标
        this.lastSlvPos = this.slv.content.getPosition();

        // 监听滚动事件
        // this.node.on("scroll-begain", () => this.onUpdate(), this);
        // this.node.on("scrolling", () => this.onUpdate(), this);
        this.node.on("scroll-ended", () => this.onUpdate(true), this);

        // 更新管理节点数组
        this.scheduleOnce(() => {
            this.updateManagedNodes();
            this.onUpdate(true);
        }, 0.5)
    }

    /**
     * 添加需要强制刷新的节点
     * @param node 目标节点
     * @param updateOpacity 是否刷新透明度，否则刷新节点active，需要确保父节点宽高未使用Layout布局
     */
    public addUpdateNode(node: cc.Node, updateOpacity?: boolean) {
        const index = this.otherNodes.findIndex(it => it.node == node);
        if (index === -1) {
            this.otherNodes.push({ node, updateOpacity });
            this.addManagedNode(node, updateOpacity);
        }
    }

    // 更新管理节点数组
    private updateManagedNodes() {
        this.managedNodes = [];
        this.collectNodes(this.slv.content, 1);
        this.forceUpdateParents.forEach(parent => {
            this.collectNodes(parent, 1);
        });
        this.otherNodes.forEach(item => {
            this.addManagedNode(item.node, item.updateOpacity);
        });
        cc.log("总节点数:", this.managedNodes.length);
    }

    // 递归收集节点
    private collectNodes(parent: cc.Node, currentDepth: number) {
        if (currentDepth > this.depth || !parent) return;

        const children = parent.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (!child.isValid) continue;

            this.addManagedNode(child);

            if (child.active && currentDepth <= this.depth) {
                this.collectNodes(child, currentDepth + 1);
            }
        }
    }

    /**
     * 添加需要强制刷新的节点
     * @param node
     * @param updateOpacity 是否刷新透明度，否则刷新节点active，需要确保父节点宽高未使用Layout布局
     */
    private addManagedNode(node: cc.Node, updateOpacity?: boolean) {
        if (!cc.isValid(node) || !node.active) return;
        let nodePos = this.slv.content.convertToNodeSpaceAR(node.convertToWorldSpaceAR(cc.Vec3.ZERO));
        let nodeBox = node.getBoundingBox();
        let nodeAnchor = node.getAnchorPoint();
        let index = this.managedNodes.findIndex(it => it.node == node);
        if (index === -1) {
            let originOpacity = this.managedOpacities[node.uuid];
            let opacity = originOpacity ?? (node.opacity || 255);
            if (originOpacity === undefined) {
                this.managedOpacities[node.uuid] = opacity;
            }
            node.opacity = opacity;
            this.managedNodes.push({
                node: node,
                active: node.active,
                opacity: opacity,
                rect: cc.rect(nodePos.x - nodeBox.width * nodeAnchor.x, nodePos.y - nodeBox.height * nodeAnchor.y, nodeBox.width, nodeBox.height),
                updateOpacity
            });
        } else {
            let item = this.managedNodes[index];
            item.rect = cc.rect(nodePos.x - nodeBox.width * nodeAnchor.x, nodePos.y - nodeBox.height * nodeAnchor.y, nodeBox.width, nodeBox.height)
            item.updateOpacity = updateOpacity;
            node.opacity = item.opacity;
        }
    }

    /**
     * Check if the node is in the display view
     * @param node target node
     * @param horizontal is horizontal
     * @param k index of managedNodes array
     */
    private isNodeInView(item: IManagedNode, horizontal?: boolean, k?: number): boolean {
        const rect = item.rect;
        if (horizontal) {
            // 判断节点左边界和右边界是否在视图范围内
            if (rect.xMin < this.slvRelativeRight && rect.xMax > this.slvRelativeLeft) {
                return true;
            }
        } else {
            // 判断节点顶部和底部是否在视图范围内
            if (rect.yMax > this.slvRelativeBottom && rect.yMin < this.slvRelativeTop) {
                return true;
            }
        }
        return false;
    }

    /**
     * update node active state for horizontal
     */
    private updateHorizontal() {
        let visibleCount = 0;
        for (let k = this.managedNodes.length - 1; k >= 0; k--) {
            const item = this.managedNodes[k] ?? {} as IManagedNode;
            const node = item.node;
            if (!cc.isValid(node)) {
                const index = k ?? this.managedNodes.findIndex(it => it.node == node);
                if (index >= 0) {
                    this.managedNodes.splice(index, 1);
                }
                continue;
            }
            const isActive = this.isNodeInView(item, true, k);
            if (isActive != item.active) {
                if (item.updateOpacity === false) {
                    node.active = isActive;
                } else {
                    node.opacity = isActive ? item.opacity : 0;
                }
                item.active = isActive;
            }
            if (isActive) {
                visibleCount++;
            }
        }
        cc.log("当前可见节点数:", visibleCount);
    }

    /**
     * update node active state for vertical
     */
    private updateVertical() {
        let visibleCount = 0;
        for (let k = this.managedNodes.length - 1; k >= 0; k--) {
            const item = this.managedNodes[k] ?? {} as any;
            const node = item.node;
            if (!cc.isValid(node)) {
                const index = k ?? this.managedNodes.findIndex(it => it.node == node);
                if (index >= 0) {
                    this.managedNodes.splice(index, 1);
                }
                continue;
            }
            const isActive = this.isNodeInView(item, false, k);
            if (isActive != item.active) {
                if (item.updateOpacity === false) {
                    node.active = isActive;
                } else {
                    node.opacity = isActive ? item.opacity : 0;
                }
                item.active = isActive;
            }
            if (isActive) {
                visibleCount++;
            }
        }
        cc.log("当前可见节点数:", visibleCount);
    }

    /**
     * update node active state
     * @param force force update
     */
    private onUpdate(force?: boolean) {
        if (!cc.isValid(this.slv)) return;

        const now = Date.now();
        const interval = now - this.lastUpdateTime;
        const horizontal = this.slv.horizontal;

        // 计算ScrollView的移动速度
        const currPos = this.slv.content.getPosition();
        const distance = horizontal ? currPos.x - this.lastSlvPos.x : currPos.y - this.lastSlvPos.y;
        const speed = Math.abs(distance) / (interval / 1000);

        // 当移动速度慢的时候，那么刷新频率也相应降低
        const realInterval = Math.max(this._interval, Math.min(5000 / speed, 1000));
        // cc.log("刷新频率:", realInterval / 1000, "移动速度:", speed);

        // 刷新频率控制
        if (!force && interval < realInterval) {
            return;
        }

        this.lastUpdateTime = now;
        this.lastSlvPos = currPos;

        // 计算ScrollView的相对坐标
        let slvWorldPos = this.slv.node.convertToWorldSpaceAR(cc.Vec3.ZERO);
        let slvRelativePos = this.slv.content.convertToNodeSpaceAR(slvWorldPos);
        let slvAnchor = this.slv.node.getAnchorPoint();

        this.slvRelativeTop = slvRelativePos.y + this.slvSize.height * (1 - slvAnchor.y);
        this.slvRelativeBottom = slvRelativePos.y - this.slvSize.height * slvAnchor.y;
        this.slvRelativeLeft = slvRelativePos.x - this.slvSize.width * slvAnchor.x;
        this.slvRelativeRight = slvRelativePos.x + this.slvSize.width * (1 - slvAnchor.x);

        if (horizontal) {
            this.updateHorizontal();
        } else {
            this.updateVertical();
        }
    }

}
