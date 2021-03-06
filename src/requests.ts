import fetch from 'isomorphic-unfetch'
import { parse, stringify } from 'qs'

import { Formats } from './formats'
import { Strings } from './strings'
import { Arrays } from './arrays'

export namespace Requests {
    import isBlankString = Strings.isBlankString
    import toInt = Formats.toInt
    import makeArray = Arrays.makeArray

    export const BASE_URL = (lang: string): string => `https://${lang}.wikiquote.org/`
    export const USER_URL = (lang: string): string => `${BASE_URL(lang)}wiki/`
    export const BASE_API_URL = (lang: string): string => `${BASE_URL(lang)}w/api.php?origin=*`
    export const SEARCH_URL = (lang: string): string =>
        `${BASE_API_URL(lang)}&format=json&action=opensearch&redirects=resolve&limit=max&search=`
    export const PAGE_URL = (lang: string): string =>
        `${BASE_API_URL(lang)}&format=json&action=parse&prop=text|categories&disabletoc&page=`

    const checkStatus = async (response): Promise<Response> => {
        if (response.ok) {
            return response
        }
        const error = new Error(response.statusText)
        error.message = response

        return Promise.reject(error)
    }

    export async function fetchJSON(url: string, options: RequestInit = {}): Promise<unknown> {
        const data = await fetch(url, options)
        const response = await checkStatus(data)

        return await response.json()
    }

    export const jsonFromUR = async (url: string, param: string): Promise<string> => {
        if (param) {
            url += encodeURIComponent(param)
        }

        const option = {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const res = await fetch(url, option)
        return await res.json()
    }

    export async function fetchHTML(url: string, options: RequestInit = {}): Promise<string> {
        const data = await fetch(url, options)

        return await data.text()
    }

    export const toBase64ImageUrl = async (imgUrl: string, options: RequestInit = {}): Promise<string> => {
        const fetchImageUrl = await fetch(imgUrl, options)
        const responseArrBuffer = await fetchImageUrl.arrayBuffer()

        return `data:${fetchImageUrl.headers.get('Content-Type') || 'image/png'};base64,${Buffer.from(
            responseArrBuffer,
        ).toString('base64')}`
    }

    export const isValidUrl = (value: string): boolean => {
        try {
            new URL(value)

            return true
        } catch (e) {
            return false
        }
    }

    export const requireValidUrl = (value: string): string => {
        if (isValidUrl(value)) {
            return value
        }
        throw new Error(`Invalid URL: ${value}`)
    }

    export const fetchJsonUrl = async (url: RequestInfo): Promise<string> => {
        const data = await fetch(url)
        const json = await data.json()

        if ('layout' in json) {
            if ('height' in json.layout) {
                json.layout.height = null
            }
            if ('width' in json.layout) {
                json.layout.width = null
            }
        }

        return json
    }

    export const toJsonUrl = (value: string): string => {
        if (isBlankString(value)) throw Error('Source URL should not be blank or empty')
        value = withHttpUrl(value)
        value = withJsonUrl(value)

        return value
    }

    export const withHttpUrl = (url: string): string =>
        !!url && !/^https?:\/\//i.test(url) ? `http://${url}` : url

    export const withJsonUrl = (url: string): string =>
        !!url && !/\.json$/i.test(url) ? `${url.replace(/\/$/, '')}.json` : url

    export const parseQueryString = (value: string): any => {
        const parameters = parse(value, { ignoreQueryPrefix: true })

        return {
            ...parameters,
            page: toInt(parameters.page),
        }
    }

    export const queryStringToState = (value: string): unknown => {
        const parameters = parseQueryString(value)

        const selectedTags = parameters.tags ? makeArray(parameters.tags) : []

        return {
            selectedTags,
            query: parameters.query || '',
            sort: parameters.sort || '',
            page: parameters.page,
        }
    }

    export const stateToQueryString = ({ query, selectedTags, sort, page }): any => {
        return stringify(
            {
                query: query || null,
                tags: selectedTags.length === 0 ? null : selectedTags,
                sort: sort === '' ? null : sort,
                page: page === 1 ? null : page,
            },
            {
                encode: false,
                arrayFormat: 'repeat',
                skipNulls: true,
            },
        )
    }

    export const replacePageNumber = (param: string, pageNum: number): string => {
        return window.location.href.replace(new RegExp(`${param}=(\\d)`), `${param}=${pageNum}`)
    }
}
