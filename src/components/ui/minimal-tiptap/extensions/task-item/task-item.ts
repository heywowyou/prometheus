import { TaskItem as BaseTaskItem } from "@tiptap/extension-task-item"
import { haptic } from "@lib/haptics"

/** A finger that moves further than this is scrolling, not tapping. */
const TAP_SLOP_PX = 10

/**
 * Tiptap's to-do item focuses the editor whenever its checkbox changes, and on
 * a phone the browser also focuses the editor on any tap inside it; either way
 * the keyboard opens. This one ticks the box and leaves focus where it was, so
 * a list can be checked off without starting to type.
 */
export const TaskItem = BaseTaskItem.extend({
  addNodeView() {
    const parent = this.parent?.()
    if (!parent) return null

    return (props) => {
      const view = parent(props)
      const { editor, getPos } = props
      const wrapper = (view.dom as HTMLElement).querySelector<HTMLElement>(":scope > label")
      const checkbox = wrapper?.querySelector<HTMLInputElement>("input[type=checkbox]")
      if (!wrapper || !checkbox) return view

      const setChecked = (checked: boolean) => {
        if (typeof getPos !== "function") return
        const position = getPos()
        if (typeof position !== "number") return
        const current = editor.state.doc.nodeAt(position)
        if (!current) return
        haptic(checked ? "success" : "light")
        editor.view.dispatch(editor.state.tr.setNodeMarkup(position, undefined, { ...current.attrs, checked }))
      }

      // Mouse and keyboard: capture runs before Tiptap's listener on the
      // checkbox, so stopping it here replaces that listener (and its focus
      // call) for editable docs. Read-only views keep the original behaviour.
      wrapper.addEventListener(
        "change",
        (event) => {
          if (!editor.isEditable) return
          event.stopPropagation()
          setChecked(checkbox.checked)
        },
        true,
      )

      // Touch: cancelling the touch stops the browser from focusing the
      // editor (and from its own click), so the box is flipped by hand.
      let start: { x: number; y: number } | null = null
      wrapper.addEventListener(
        "touchstart",
        (event) => {
          const touch = event.touches[0]
          start = event.touches.length === 1 && touch ? { x: touch.clientX, y: touch.clientY } : null
          event.stopPropagation()
        },
        { passive: true },
      )
      wrapper.addEventListener(
        "touchend",
        (event) => {
          const touch = event.changedTouches[0]
          const tapped =
            start && touch && Math.hypot(touch.clientX - start.x, touch.clientY - start.y) <= TAP_SLOP_PX
          start = null
          if (!tapped || !editor.isEditable) return
          event.preventDefault()
          event.stopPropagation()
          setChecked(!checkbox.checked)
        },
        { passive: false },
      )

      return view
    }
  },
})
