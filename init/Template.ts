export interface Template {
  message: string
  recommendedComponentFolder: string
  test(): boolean
  pluginsCode: string
}
