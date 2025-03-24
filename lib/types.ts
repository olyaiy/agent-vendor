export type SearchResults = {
  images: SearchResultImage[]
  results: SearchResultItem[]
  number_of_results?: number
  query: string
}


export type SearchResultImage =
  | string
  | {
      url: string
      description: string
      number_of_results?: number
    }


  export type SearchResultItem = {
    title: string
    url: string
    content: string
}




export interface SearXNGResult {
  title: string
  url: string
  content: string
  img_src?: string
  publishedDate?: string
  score?: number
}

export interface SearXNGResponse {
  query: string
  number_of_results: number
  results: SearXNGResult[]
}

export type SearXNGImageResult = string

export type SearXNGSearchResults = {
  images: SearXNGImageResult[]
  results: SearchResultItem[]
  number_of_results?: number
  query: string
}