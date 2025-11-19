/**
 * 工具类
 */
export default class Utils {

	/**
	 * 转换为数值
	 * @param value 需要转换的值
	 * @param useParseFloat 是否使用 parseFloat 进行转换
	 * @returns 转换后的数字
	 */
	public static toNumber(v: any, useParseFloat: boolean = false): number {
		let num = v
		if (typeof v !== "number") {
			if (useParseFloat) {
				num = parseFloat(String(v)) || 0
			} else {
				num = Number(v) || 0
			}
		}
		if (isNaN(num)) {
			return 0
		}
		return num
	}

	/**
	 * 截取字符串，超出部分用指定字符串或者...表示
	 * @param label 用于测量的 Label
	 * @param text 需要截取的字符串
	 * @param maxWidth 指定最大宽度；未提供时取 label 当前宽度
	 * @param tailStr 尾部字符串
	 * @returns 截取后的字符串
	 */
	public static truncateText(label: cc.Label, text: string, maxWidth?: number, tailStr = '...') {
		if (!cc.isValid(label) || !cc.isValid(label.node)) return text;
		if (typeof text !== "string") text = text == null ? "" : String(text);

		const uiTransform = label.node["_uiProps"]?.uiTransformComp;
		const originWidth = uiTransform ? uiTransform.width : label.node.width;
		const limit = typeof maxWidth === "number" ? maxWidth : originWidth;
		if (!text || limit <= 0) {
			label.string = "";
			return "";
		}

		const originOverflow = label.overflow;
		label.overflow = cc.Label.Overflow.NONE;

		const measure = (value: string): number => {
			label.string = value;
			label['_forceUpdateRenderData']?.(true);
			return label.node["_uiProps"]?.uiTransformComp?.width || label.node.width;
		};

		const normalizeTail = (value: string): string => {
			if (!value) return "";
			let tail = "";
			for (const char of value) {
				const candidate = tail + char;
				if (measure(candidate) > limit) break;
				tail = candidate;
			}
			return tail;
		};

		if (measure(text) <= limit) {
			label.string = text;
		} else {
			const tail = normalizeTail(tailStr ?? "");
			let visible = "";
			for (const char of text) {
				const candidate = visible + char;
				const total = tail ? candidate + tail : candidate;
				if (measure(total) > limit) break;
				visible = candidate;
			}
			label.string = visible + tail;
		}

		label.overflow = originOverflow;
		label.string = label.string;
		if (uiTransform) {
			uiTransform.width = originWidth;
		} else {
			label.node.width = originWidth;
		}
		label['_forceUpdateRenderData']?.(true);
		return label.string;
	}

}
