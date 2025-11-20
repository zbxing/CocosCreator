/** 
 * FlowLayout, 流式布局组件，用于自动排列子节点。从上到下，从左到右排满布局。
 * 适用于需要自动排列子节点的场景，如列表、网格等。
 */

const { ccclass, property, executeInEditMode } = cc._decorator;

/**
 * 布局类型枚举
 */
enum FlowLayoutType {
    HORIZONTAL = 0,  // 从左到右
    VERTICAL = 1     // 从上到下
}

/**
 * Padding 内边距类
 */
@ccclass('FlowLayoutPadding')
class FlowLayoutPadding {
    private _layout: FlowLayout = null;
    
    setLayout(layout: FlowLayout) {
        this._layout = layout;
    }
    
    private markLayoutUpdate() {
        if (this._layout) {
            this._layout.markUpdate();
        }
    }

    @property({ tooltip: "距离顶部的间距" })
    get top(): number {
        return this._top;
    }
    set top(v: number) {
        if (this._top !== v) {
            this._top = v;
            this.markLayoutUpdate();
        }
    }
    private _top: number = 0;

    @property({ tooltip: "距离底部的间距" })
    get bottom(): number {
        return this._bottom;
    }
    set bottom(v: number) {
        if (this._bottom !== v) {
            this._bottom = v;
            this.markLayoutUpdate();
        }
    }
    private _bottom: number = 0;

    @property({ tooltip: "距离左侧的间距" })
    get left(): number {
        return this._left;
    }
    set left(v: number) {
        if (this._left !== v) {
            this._left = v;
            this.markLayoutUpdate();
        }
    }
    private _left: number = 0;

    @property({ tooltip: "距离右侧的间距" })
    get right(): number {
        return this._right;
    }
    set right(v: number) {
        if (this._right !== v) {
            this._right = v;
            this.markLayoutUpdate();
        }
    }
    private _right: number = 0;
}

@ccclass
@executeInEditMode
export default class FlowLayout extends cc.Component {
    
    @property({ type: cc.Enum(FlowLayoutType), tooltip: "HORIZONTAL: 从左到右排列，固定高度\nVERTICAL: 从上到下排列，固定宽度"})
    get type(): FlowLayoutType {
        return this._type;
    }
    set type(v: FlowLayoutType) {
        if (this._type !== v) {
            this._type = v;
            this.markUpdate();
        }
    }

    @property({ type: FlowLayoutPadding, tooltip: "布局的内边距"})
    get padding(): FlowLayoutPadding {
        return this._padding;
    }
    set padding(v: FlowLayoutPadding) {
        if (this._padding !== v) {
            this._padding = v;
            if (this._padding) {
                this._padding.setLayout(this);
            }
            this.markUpdate();
        }
    }

    @property({ tooltip: "子节点之间的水平间距" })
    get spaceX(): number {
        return this._spaceX;
    }
    set spaceX(v: number) {
        if (this._spaceX !== v) {
            this._spaceX = v;
            this.markUpdate();
        }
    }

    @property({ tooltip: "子节点之间的垂直间距" })
    get spaceY(): number {
        return this._spaceY;
    }
    set spaceY(v: number) {
        if (this._spaceY !== v) {
            this._spaceY = v;
            this.markUpdate();
        }
    }

    @property({ tooltip: "是否自动刷新布局。取消勾选后，布局不会自动更新，需要手动调用 updateLayout() 方法" })
    get autoUpdate(): boolean {
        return this._autoUpdate;
    }
    set autoUpdate(v: boolean) {
        const wasEnabled = this._autoUpdate;
        this._autoUpdate = v;
        
        // 如果从禁用变为启用，立即更新缓存状态并刷新布局
        if (!wasEnabled && v) {
            this.refreshCacheAndUpdate();
        }
    }

    private _type: FlowLayoutType = FlowLayoutType.VERTICAL;
    private _padding: FlowLayoutPadding = new FlowLayoutPadding();
    private _spaceX: number = 0;
    private _spaceY: number = 0;
    private _autoUpdate: boolean = true;

    private _needUpdate: boolean = false;
    private _updateTimer: number = null;
    private _lastChildCount: number = 0;
    private _lastVisibleChildCount: number = 0;
    private _lastPaddingHash: string = "";
    private _lastScaleHash: string = "";
    private _lastAnchorX: number = 0.5;
    private _lastAnchorY: number = 0.5;
    private _visibleChildrenCache: cc.Node[] = null;
    private _cacheValid: boolean = false;
    private _checkFrameCount: number = 0; // 检查帧计数器，用于降低检查频率

    onLoad() {
        if (!this._padding) {
            this._padding = new FlowLayoutPadding();
        }
        this._padding.setLayout(this);
        this._lastChildCount = this.node.children.length;
        this._lastVisibleChildCount = this.getVisibleChildren().length;
        this._lastAnchorX = this.node.anchorX;
        this._lastAnchorY = this.node.anchorY;
        this.invalidateCache(); // 初始化时失效缓存
        this.markUpdate();
    }

    onEnable() {
        this._lastChildCount = this.node.children.length;
        this._lastAnchorX = this.node.anchorX;
        this._lastAnchorY = this.node.anchorY;
        this.markUpdate();
        this.registerEvents();
    }

    onDisable() {
        this.unregisterEvents();
        this.cancelUpdate();
    }

    onDestroy() {
        this.unregisterEvents();
        this.cancelUpdate();
    }

    /**
     * 注册事件监听
     */
    private registerEvents() {
        // 监听子节点添加/移除/重排序
        this.node.on(cc.Node.EventType.CHILD_ADDED, this.onChildChanged, this);
        this.node.on(cc.Node.EventType.CHILD_REMOVED, this.onChildChanged, this);
        this.node.on(cc.Node.EventType.CHILD_REORDER, this.markUpdate, this);
        
        // 监听节点尺寸变化
        this.node.on(cc.Node.EventType.SIZE_CHANGED, this.markUpdate, this);
        
        // 监听子节点的变化（统一在父节点监听，避免为每个子节点单独监听）
        this.node.on(cc.Node.EventType.CHILD_ADDED, this.onAnyChildChanged, this);
        this.node.on(cc.Node.EventType.CHILD_REMOVED, this.onAnyChildChanged, this);
    }

    /**
     * 取消事件监听
     */
    private unregisterEvents() {
        this.node.off(cc.Node.EventType.CHILD_ADDED, this.onChildChanged, this);
        this.node.off(cc.Node.EventType.CHILD_REMOVED, this.onChildChanged, this);
        this.node.off(cc.Node.EventType.CHILD_REORDER, this.markUpdate, this);
        this.node.off(cc.Node.EventType.SIZE_CHANGED, this.markUpdate, this);
        this.node.off(cc.Node.EventType.CHILD_ADDED, this.onAnyChildChanged, this);
        this.node.off(cc.Node.EventType.CHILD_REMOVED, this.onAnyChildChanged, this);
    }

    /**
     * 子节点变化时的处理（用于注册子节点事件）
     */
    private onChildChanged(child: cc.Node) {
        if (child && child.isValid) {
            // 监听子节点的尺寸、缩放变化
            child.on(cc.Node.EventType.SIZE_CHANGED, this.onChildSizeChanged, this);
            child.on(cc.Node.EventType.SCALE_CHANGED, this.onChildScaleChanged, this);
        }
        // 子节点添加/移除时，需要失效缓存
        this.invalidateCache();
    }

    /**
     * 子节点尺寸变化
     */
    private onChildSizeChanged() {
        // 尺寸变化不影响可见子节点列表，不需要失效缓存
        this.markUpdate();
    }

    /**
     * 子节点缩放变化
     */
    private onChildScaleChanged() {
        // 缩放变化不影响可见子节点列表，不需要失效缓存
        this.markUpdate();
    }

    /**
     * 任何子节点变化时的处理（用于标记更新）
     */
    private onAnyChildChanged() {
        // 子节点添加/移除时，需要失效缓存
        this.invalidateCache();
        this.markUpdate();
    }

    /**
     * 标记需要更新（带防抖）
     */
    public markUpdate() {
        if (!this._autoUpdate) {
            return; // 如果禁用了自动更新，则不标记
        }
        this._needUpdate = true;
    }

    /**
     * 失效缓存（只在子节点列表变化时调用）
     */
    private invalidateCache() {
        this._cacheValid = false;
        this._visibleChildrenCache = null;
    }

    /**
     * 刷新缓存状态并更新布局（用于重新启用自动更新时）
     */
    private refreshCacheAndUpdate() {
        // 更新所有缓存状态
        this._lastChildCount = this.node.children.length;
        this._lastVisibleChildCount = this.getVisibleChildCount();
        this._lastScaleHash = this.getScaleHash();
        this._lastAnchorX = this.node.anchorX;
        this._lastAnchorY = this.node.anchorY;
        if (this._padding) {
            this._lastPaddingHash = `${this._padding.top}_${this._padding.bottom}_${this._padding.left}_${this._padding.right}`;
        }
        
        // 失效缓存，强制重新计算
        this.invalidateCache();
        
        // 立即更新布局
        this._needUpdate = true;
        this._updateLayout();
    }

    /**
     * 取消更新
     */
    private cancelUpdate() {
        this._needUpdate = false;
        if (this._updateTimer !== null) {
            clearTimeout(this._updateTimer);
            this._updateTimer = null;
        }
    }

    /**
     * 立即更新布局
     */
    public updateLayout() {
        this.refreshCacheAndUpdate();
    }

    private _updateLayout() {
        this._needUpdate = false;
        this.performLayout();
    }

    /**
     * 执行布局计算
     */
    private performLayout() {
        if (!this.node || !this.node.isValid) {
            return;
        }

        const children = this.getVisibleChildren();
        if (children.length === 0) {
            // 没有子节点时，设置最小尺寸
            const padding = this._padding;
            if (this._type === FlowLayoutType.HORIZONTAL) {
                this.node.width = (padding ? padding.left : 0) + (padding ? padding.right : 0);
            } else {
                this.node.height = (padding ? padding.top : 0) + (padding ? padding.bottom : 0);
            }
            return;
        }

        if (this._type === FlowLayoutType.HORIZONTAL) {
            this.performHorizontalLayout(children);
        } else {
            this.performVerticalLayout(children);
        }
    }

    /**
     * 执行水平布局（从左到右，固定高度，自动计算宽度）
     */
    private performHorizontalLayout(children: cc.Node[]) {
        const padding = this._padding;
        const paddingTop = padding ? padding.top : 0;
        const paddingBottom = padding ? padding.bottom : 0;
        const paddingLeft = padding ? padding.left : 0;
        const paddingRight = padding ? padding.right : 0;
        
        const containerHeight = this.node.height - paddingTop - paddingBottom;
        if (containerHeight <= 0) {
            return;
        }

        // 计算可用区域的起始位置（相对于父节点锚点）
        const startX = -this.node.width * this.node.anchorX + paddingLeft;
        const startY = this.node.height * (1 - this.node.anchorY) - paddingTop;
        let currentX = startX;
        let currentY = startY;
        let maxWidthInColumn = 0;
        let rightX = currentX; // 记录最右侧的 X 位置

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            // 考虑缩放
            const childWidth = child.width * Math.abs(child.scaleX);
            const childHeight = child.height * Math.abs(child.scaleY);

            // 检查是否需要换列（当前列放不下这个节点）
            if (i > 0 && currentY - childHeight < startY - containerHeight) {
                // 换列：向右移动（X 增加）
                currentX += (maxWidthInColumn + this._spaceX);
                currentY = startY;
                maxWidthInColumn = 0;
            }

            // 计算子节点中心位置
            const childX = currentX + childWidth * child.anchorX;
            const childY = currentY - childHeight * (1 - child.anchorY);

            child.setPosition(childX, childY);

            // 更新当前列最大宽度
            maxWidthInColumn = Math.max(maxWidthInColumn, childWidth);

            // 更新下一节点的 Y 位置
            currentY -= (childHeight + this._spaceY);

            // 记录最右侧的 X 位置（用于计算总宽度）
            rightX = Math.max(rightX, currentX + maxWidthInColumn);
        }

        // 计算总宽度
        const leftX = -this.node.width * this.node.anchorX + paddingLeft;
        const totalWidth = rightX - leftX + paddingRight;
        
        if (Math.abs(this.node.width - totalWidth) > 0.01) {
            this.node.width = totalWidth;
        }
    }

    /**
     * 执行垂直布局（从上到下，固定宽度，自动计算高度）
     */
    private performVerticalLayout(children: cc.Node[]) {
        const padding = this._padding;
        const paddingTop = padding ? padding.top : 0;
        const paddingBottom = padding ? padding.bottom : 0;
        const paddingLeft = padding ? padding.left : 0;
        const paddingRight = padding ? padding.right : 0;
        
        const containerWidth = this.node.width - paddingLeft - paddingRight;
        if (containerWidth <= 0) {
            return;
        }

        // 计算可用区域的起始位置（相对于父节点锚点）
        const startX = -this.node.width * this.node.anchorX + paddingLeft;
        let currentX = startX;
        let currentY = this.node.height * (1 - this.node.anchorY) - paddingTop;
        let maxHeightInRow = 0;
        let bottomY = currentY; // 记录最底部的 Y 位置

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            // 考虑缩放
            const childWidth = child.width * Math.abs(child.scaleX);
            const childHeight = child.height * Math.abs(child.scaleY);

            // 检查是否需要换行（当前行放不下这个节点）
            if (i > 0 && currentX + childWidth > startX + containerWidth) {
                // 换行：向下移动（Y 减小）
                currentY -= (maxHeightInRow + this._spaceY);
                currentX = startX;
                maxHeightInRow = 0;
            }

            // 计算子节点中心位置
            const childX = currentX + childWidth * child.anchorX;
            const childY = currentY - childHeight * (1 - child.anchorY);

            child.setPosition(childX, childY);

            // 更新当前行最大高度
            maxHeightInRow = Math.max(maxHeightInRow, childHeight);

            // 更新下一节点的 X 位置
            currentX += (childWidth + this._spaceX);

            // 记录最底部的 Y 位置（用于计算总高度）
            bottomY = Math.min(bottomY, currentY - maxHeightInRow);
        }

        // 计算总高度
        const topY = this.node.height * (1 - this.node.anchorY) - paddingTop;
        const totalHeight = topY - bottomY + paddingBottom;
        
        if (Math.abs(this.node.height - totalHeight) > 0.01) {
            this.node.height = totalHeight;
        }
    }

    /**
     * 快速检查可见子节点数量（不构建完整列表，性能更好）
     */
    private getVisibleChildCount(): number {
        if (this._cacheValid && this._visibleChildrenCache) {
            return this._visibleChildrenCache.length;
        }
        
        // 如果缓存无效，快速计算数量（不构建完整列表）
        let count = 0;
        const childCount = this.node.children.length;
        for (let i = 0; i < childCount; i++) {
            const child = this.node.children[i];
            if (child && child.active && child.isValid) {
                count++;
            }
        }
        return count;
    }

    /**
     * 获取所有可见的子节点（带缓存）
     */
    private getVisibleChildren(): cc.Node[] {
        if (this._cacheValid && this._visibleChildrenCache) {
            return this._visibleChildrenCache;
        }
        
        const children: cc.Node[] = [];
        const childCount = this.node.children.length;
        
        for (let i = 0; i < childCount; i++) {
            const child = this.node.children[i];
            if (child && child.active && child.isValid) {
                children.push(child);
            }
        }
        
        this._visibleChildrenCache = children;
        this._cacheValid = true;
        return children;
    }

    /**
     * 计算子节点scale的hash值（用于检测缩放变化）
     */
    private getScaleHash(): string {
        const children = this.node.children;
        if (children.length === 0) {
            return "";
        }
        
        let hash = "";
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child && child.isValid) {
                hash += `${child.scaleX.toFixed(2)}_${child.scaleY.toFixed(2)}_`;
            }
        }
        return hash;
    }

    /**
     * 编辑器模式下的更新
     */
    update(dt: number) {
        // 如果禁用了自动更新，不做任何处理
        if (!this._autoUpdate) {
            return;
        }
        
        // 降低检查频率：运行时每5帧检查一次，编辑器模式每帧检查
        const shouldCheck = CC_EDITOR || (this._checkFrameCount % 5 === 0);
        this._checkFrameCount++;
        
        // 只在需要检查时才执行检查逻辑
        if (shouldCheck) {
            // 检查子节点数量变化（用于检测子节点添加/移除）- 这个检查很快，只是读取 length
            const currentChildCount = this.node.children.length;
            if (currentChildCount !== this._lastChildCount) {
                this._lastChildCount = currentChildCount;
                this.invalidateCache();
                this.markUpdate();
            }
            
            // 检查可见子节点数量变化（用于检测子节点显示/隐藏）- 使用快速检查方法
            const currentVisibleCount = this.getVisibleChildCount();
            if (currentVisibleCount !== this._lastVisibleChildCount) {
                this._lastVisibleChildCount = currentVisibleCount;
                this.invalidateCache();
                this.markUpdate();
            }
            
            // 检查子节点缩放变化（用于检测缩放）- 这个计算较耗时，降低检查频率
            if (CC_EDITOR || this._checkFrameCount % 10 === 0) {
                const currentScaleHash = this.getScaleHash();
                if (currentScaleHash !== this._lastScaleHash) {
                    this._lastScaleHash = currentScaleHash;
                    this.markUpdate();
                }
            }
            
            // 检查节点锚点变化
            const currentAnchorX = this.node.anchorX;
            const currentAnchorY = this.node.anchorY;
            if (Math.abs(currentAnchorX - this._lastAnchorX) > 0.001 || Math.abs(currentAnchorY - this._lastAnchorY) > 0.001) {
                this._lastAnchorX = currentAnchorX;
                this._lastAnchorY = currentAnchorY;
                this.markUpdate();
            }
            
            // 检查 padding 值变化（编辑器模式下）
            if (CC_EDITOR && this._padding) {
                const paddingHash = `${this._padding.top}_${this._padding.bottom}_${this._padding.left}_${this._padding.right}`;
                if (paddingHash !== this._lastPaddingHash) {
                    this._lastPaddingHash = paddingHash;
                    this.markUpdate();
                }
            }
        }
        
        if (CC_EDITOR && this._needUpdate) {
            // 编辑器模式下延迟更新，避免频繁刷新（防抖 16ms，约 60fps）
            if (this._updateTimer !== null) {
                clearTimeout(this._updateTimer);
            }
            this._updateTimer = setTimeout(() => {
                this._updateLayout();
                this._updateTimer = null;
            }, 16) as any;
        }
        
        // 运行时也检查子节点的显示/隐藏状态变化
        if (!CC_EDITOR && this._needUpdate) {
            this._updateLayout();
        }
    }
}
