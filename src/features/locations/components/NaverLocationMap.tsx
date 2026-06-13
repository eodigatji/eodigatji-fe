import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_MAP_CENTER,
  type Coordinates,
} from '../lib/locationCoordinates'
import { loadNaverMaps } from '../lib/loadNaverMaps'

export type NaverLocationMarker = Coordinates & {
  id: number
  name: string
  detail?: string
  number?: string
}

type NaverLocationMapProps = {
  markers?: NaverLocationMarker[]
  selectedCoordinates?: Coordinates | null
  activeMarkerId?: number | null
  onMarkerSelect?: (marker: NaverLocationMarker) => void
  onSelectCoordinates?: (coordinates: Coordinates) => void
  className?: string
  emptyMessage?: string
}

function NaverLocationMap({
  markers = [],
  selectedCoordinates = null,
  activeMarkerId = null,
  onMarkerSelect,
  onSelectCoordinates,
  className = '',
  emptyMessage = '지도 준비 중입니다.',
}: NaverLocationMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const naverRef = useRef<any>(null)
  const markerInstancesRef = useRef<any[]>([])
  const selectionMarkerRef = useRef<any>(null)
  const onMarkerSelectRef = useRef(onMarkerSelect)
  const onSelectCoordinatesRef = useRef(onSelectCoordinates)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  const initialCenter = useMemo(() => {
    if (selectedCoordinates) {
      return selectedCoordinates
    }

    if (markers.length > 0) {
      return markers[0]
    }

    return DEFAULT_MAP_CENTER
  }, [markers, selectedCoordinates])

  useEffect(() => {
    onMarkerSelectRef.current = onMarkerSelect
  }, [onMarkerSelect])

  useEffect(() => {
    onSelectCoordinatesRef.current = onSelectCoordinates
  }, [onSelectCoordinates])

  useEffect(() => {
    let cancelled = false

    async function setupMap() {
      try {
        setStatus('loading')
        setErrorMessage('')

        const naver = await loadNaverMaps()
        if (cancelled || !mapElementRef.current) return

        naverRef.current = naver

        if (!mapRef.current) {
          mapRef.current = new naver.maps.Map(mapElementRef.current, {
            center: new naver.maps.LatLng(initialCenter.latitude, initialCenter.longitude),
            zoom: 16,
          })

          naver.maps.Event.addListener(mapRef.current, 'click', (event: any) => {
            if (!onSelectCoordinatesRef.current) return

            const latLng = event.coord
              ? mapRef.current.coordToLatLng(event.coord)
              : event.latlng

            if (!latLng) return

            onSelectCoordinatesRef.current({
              latitude: Number(latLng.lat().toFixed(6)),
              longitude: Number(latLng.lng().toFixed(6)),
            })
          })
        }

        setStatus('ready')
      } catch (error) {
        if (cancelled) return
        setStatus('error')
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '네이버 지도를 불러오지 못했습니다.',
        )
      }
    }

    void setupMap()

    return () => {
      cancelled = true
    }
  }, [initialCenter.latitude, initialCenter.longitude])

  useEffect(() => {
    if (!mapRef.current || !naverRef.current) return

    const naver = naverRef.current
    const map = mapRef.current

    for (const marker of markerInstancesRef.current) {
      marker.setMap(null)
    }
    markerInstancesRef.current = []

    if (!markers.length) {
      return
    }

    const bounds = new naver.maps.LatLngBounds()

    for (const markerData of markers) {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(markerData.latitude, markerData.longitude),
        map,
        title: markerData.name,
        zIndex: markerData.id === activeMarkerId ? 10 : 1,
      })

      markerInstancesRef.current.push(marker)
      bounds.extend(new naver.maps.LatLng(markerData.latitude, markerData.longitude))

      naver.maps.Event.addListener(marker, 'click', () => {
        onMarkerSelectRef.current?.(markerData)
      })
    }

    if (!selectedCoordinates && markers.length > 1) {
      map.fitBounds(bounds)
    }
  }, [activeMarkerId, markers, selectedCoordinates])

  useEffect(() => {
    if (!mapRef.current || !naverRef.current || !selectedCoordinates) return

    const naver = naverRef.current
    const map = mapRef.current
    const position = new naver.maps.LatLng(
      selectedCoordinates.latitude,
      selectedCoordinates.longitude,
    )

    if (!selectionMarkerRef.current) {
      selectionMarkerRef.current = new naver.maps.Marker({ position })
    }

    selectionMarkerRef.current.setPosition(position)
    selectionMarkerRef.current.setMap(map)
    map.panTo(position)
  }, [selectedCoordinates])

  useEffect(() => {
    if (!selectionMarkerRef.current || selectedCoordinates) return
    selectionMarkerRef.current.setMap(null)
  }, [selectedCoordinates])

  return (
    <div className={`location-map-frame ${className}`}>
      <div ref={mapElementRef} className="location-map-canvas" />

      {status !== 'ready' ? (
        <div className="location-map-overlay">
          <p className="text-sm font-medium text-(--text-strong)">
            {status === 'error' ? errorMessage : emptyMessage}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default NaverLocationMap
