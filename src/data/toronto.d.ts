declare module '*.geojson' {
  const value: {
    elements: Array<{
      type: string
      id: number
      lat?: number
      lon?: number
      nodes?: number[]
      tags?: Record<string, string>
    }>
  }
  export default value
}