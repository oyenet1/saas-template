export function useConfirm() {
  const open = ref(false)
  const title = ref('Are you sure?')
  const description = ref('')
  let resolvePromise: ((v: boolean) => void) | null = null

  function confirm(msg?: string, desc?: string): Promise<boolean> {
    title.value = msg ?? 'Are you sure?'
    description.value = desc ?? ''
    open.value = true
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  function onConfirm() {
    open.value = false
    resolvePromise?.(true)
    resolvePromise = null
  }

  function onCancel() {
    open.value = false
    resolvePromise?.(false)
    resolvePromise = null
  }

  return { open, title, description, confirm, onConfirm, onCancel }
}
