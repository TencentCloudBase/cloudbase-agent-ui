// 1. 引入组件
import { MultiMarker, MultiPolyline, BaseMap, TMap } from "tlbs-map-react";
import { useRef, useCallback, useState, useEffect } from "react";
import type { ToolCardProps } from "@cloudbase/agent-ui-react";

// 样式
const styles = {
  multiMarkerStyle: {
    width: 20,
    height: 30,
    anchor: { x: 10, y: 30 },
  },
  polyline: {
    color: "#07c160",
    width: 5,
    borderWidth: 0,
  },
};

interface MapState {
  latitude: number;
  longitude: number;
  scale: number;
  markers: Array<{
    id: number;
    latitude: number;
    longitude: number;
    width: number;
    height: number;
  }>;
  adcode: string;
  routeMode: string;
  routeInfo: Record<string, any>;
  polyline?: Array<{
    points: Array<{
      latitude: number;
      longitude: number;
    }>;
    color: string;
    width: number;
    dottedLine: boolean;
  }>;
  geometries: {
    styleId: string;
    position: {
      lat: number;
      lng: number;
    };
  }[];
}

interface Geometry {
  styleId: string;
  position: {
    lat: number;
    lng: number;
  };
}

interface PolylineGeometry {
  styleId: string;
  paths: Array<{
    lat: number;
    lng: number;
  }>;
}

const transformRawPolyline = (polyline: any[]) => {
  let transformPolyline = [];
  for (let i = 2; i < polyline.length; i++) {
    polyline[i] = polyline[i - 2] + polyline[i] / 1000000;
  }
  for (let i = 0; i < polyline.length; i += 2) {
    transformPolyline.push({
      lat: polyline[i],
      lng: polyline[i + 1],
    });
  }
  return transformPolyline;
};

export default (props: ToolCardProps) => {
  // TODO: 待迁移key至服务端
  const apiKey = import.meta.env.VITE_TENCENT_MAP_API_KEY; //
  // 获取地图实例 mapRef.current
  const mapRef = useRef(null);
  // 获取点标记图层实例 markerRef.current
  const markerRef = useRef(null);
  const polylineRef: any = useRef(null);

  const clickHandler = useCallback((event: TMap.MapEvent) => {
    console.log("🚀🚀🚀 点标记图层点击事件", event);
  }, []);

  // 数据
  const { toolData, toolParams, name } = props;
  const [geometries, setGeometries] = useState<Geometry[]>([]);
  const [polylineGeometries, setPolylineGeometries] = useState<PolylineGeometry[]>([]);
  const [center, setCenter] = useState<null | { lat: number; lng: number }>(null);
  const [zoom, setZoom] = useState(17);

  // Geocoder - Convert address to coordinates
  console.log("name", name, toolParams, toolData);

  /**
   * 地图初始化完成事件处理器
   * @param event
   */
  const onMapInited = useCallback(() => {
    console.log("🚀🚀🚀 地图加载完成, 打印图层实例", markerRef.current);
  }, []);

  useEffect(() => {
    if (name === "geocoder" && toolData?.content[0]?.type === "text") {
      try {
        const contentData = JSON.parse(toolData.content[0].text);
        console.log("contentData", contentData);
        const {
          result: {
            location: { lat, lng },
          },
        } = contentData;

        let parseGeometries = [
          {
            styleId: "multiMarkerStyle",
            position: { lat, lng },
          },
        ];
        console.log("geometries", parseGeometries, lat, lng);
        setGeometries(parseGeometries);
        setCenter({ lat, lng });
      } catch (error) {
        console.error("Error parsing geocoder data:", error);
      }
    }
    // Place Search Nearby - Search for places near a specific location
    if (name === "placeSearchNearby" && toolData?.content[0]?.type === "text") {
      try {
        const location = toolParams.location || "";
        const locationInfo = location.split(",");
        console.log("locationInfo", locationInfo);
        const contentData = JSON.parse(toolData.content[0].text);
        const { data } = contentData;
        const parseGeometries = data.map((item: any) => ({
          styleId: "multiMarkerStyle",
          position: { lat: item.location.lat, lng: item.location.lng },
        }));
        console.log("parseGeometries", parseGeometries);
        setGeometries(parseGeometries);
        setCenter({ lat: parseFloat(locationInfo[0]), lng: parseFloat(locationInfo[1]) });
        setZoom(12);
      } catch (error) {
        console.error("Error parsing placeSearchNearby data:", error);
      }
    }
    // Direction Driving - Route planning
    if (name === "directionDriving" && toolData.content[0]?.type === "text") {
      try {
        const from = toolParams.from || "";
        const to = toolParams.to || "";
        const fromInfo = from.split(",");
        const toInfo = to.split(",");
        const contentData = JSON.parse(toolData.content[0].text);
        const {
          result: { routes },
        } = contentData;

        if (routes.length) {
          const firstRoute = routes[0];
          const { polyline, steps } = firstRoute;
          const transformPolyline = transformRawPolyline(polyline);
          const polylineGeometries = [
            {
              styleId: "polyline",
              paths: transformPolyline,
            },
          ];
          const startAndEndPair = [
            {
              styleId: "multiMarkerStyle",
              position: {
                lat: parseFloat(fromInfo[0]),
                lng: parseFloat(fromInfo[1]),
              },
            },
            {
              styleId: "multiMarkerStyle",
              position: {
                lat: parseFloat(toInfo[0]),
                lng: parseFloat(toInfo[1]),
              },
            },
          ];
          setCenter({ lat: parseFloat(fromInfo[0]), lng: parseFloat(fromInfo[1]) });
          setGeometries(startAndEndPair);
          setPolylineGeometries(polylineGeometries);
          setZoom(12);
        }
      } catch (error) {
        console.error("Error parsing directionDriving data:", error);
      }
    }
  }, []);

  return (
    <>
      {center && geometries.length > 0 && (
        <BaseMap onMapInited={onMapInited} ref={mapRef} apiKey={apiKey} options={{ zoom, center }}>
          {/* {name !== 'directionDriving' ? (
            <MultiMarker ref={markerRef} styles={styles} geometries={geometries} onClick={clickHandler} />
          ) : (
            <MultiPolyline ref={polylineRef} geometries={polylineGeometries} styles={styles} />
          )} */}
          <MultiMarker ref={markerRef} styles={styles} geometries={geometries} onClick={clickHandler} />
          {name === "directionDriving" && (
            <MultiPolyline ref={polylineRef} geometries={polylineGeometries} styles={styles} />
          )}
        </BaseMap>
      )}
    </>
  );
};
