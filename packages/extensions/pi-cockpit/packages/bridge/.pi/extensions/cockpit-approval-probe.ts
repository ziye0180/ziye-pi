/**
 * 审批流 dev fixture:注册一个会触发 host-ui confirm/select/input 的探针工具,
 * 用于端到端验证 cockpit 工具卡内的审批/中断 UI(pi 默认 YOLO 无权限系统,
 * 没有它就无法自然触发工具关联的 host-ui 请求)。
 *
 * 用法:对 pi 说「调用 cockpit_approval_probe 工具,kind 用 confirm」。
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const ProbeParams = Type.Object({
  kind: Type.Union(
    [Type.Literal("confirm"), Type.Literal("select"), Type.Literal("input")],
    { description: "要触发的 host-ui 请求类型" },
  ),
});

export default function cockpitApprovalProbe(pi: ExtensionAPI) {
  pi.registerTool({
    name: "cockpit_approval_probe",
    label: "Approval Probe",
    description:
      "Dev probe that raises a blocking host-ui request (confirm/select/input) so the cockpit approval UI can be tested end-to-end. Call it when the user asks to test the approval flow.",
    parameters: ProbeParams,
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (params.kind === "confirm") {
        const ok = await ctx.ui.confirm("审批探针", "是否批准这次探针操作?");
        return {
          content: [{ type: "text", text: ok ? "用户已批准" : "用户已拒绝" }],
        };
      }
      if (params.kind === "select") {
        const picked = await ctx.ui.select("选择探针", ["选项甲", "选项乙", "选项丙"]);
        return {
          content: [{ type: "text", text: `用户选择: ${picked ?? "(跳过)"}` }],
        };
      }
      const typed = await ctx.ui.input("输入探针", "随便输点什么");
      return {
        content: [{ type: "text", text: `用户输入: ${typed ?? "(跳过)"}` }],
      };
    },
  });
}
