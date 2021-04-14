<template>
  <div id="app">
    <div class="row no-gutters">
      <!-- 左側搜尋 -->
      <div class="col-sm-3">
        <div class="toolbox">
          <div class="sticky-top bg-white shadow-sm p-2">
            <div class="form-group d-flex">
              <label
                for="CityName"
                class="mr-2 col-form-label text-right"
              >
              縣市
              </label>
              <div class="flex-fill">
                <select
                  id="city"
                  class="form-control"
                  v-model="select.city"
                  @change="select.area = ''"
                >
                <option value="">-- Select One --</option>
                <option
                  v-for="city in CityName"
                  :key="city.CityName"
                  :value="city.CityName"
                >
                  {{ city.CityName }}
                </option>
              </select>
              </div>
            </div>
            <div class="form-group d-flex">
              <label
                for="area"
                class="mr-2 col-form-label text-right"
              >
                地區
              </label>
              <div class="flex-fill">
                <select
                  id="area"
                  class="form-control"
                  v-model="select.area"
                  @change="updateSelect"
                >
                <option value="">-- Select One --</option>
                <option
                  v-for="area in CityName.find((city) => (
                    city.CityName === select.city)).AreaList"
                  :key="area.AreaName"
                  :value="area.AreaName"
                >
                  {{ area.AreaName }}
                </option>
              </select>
              </div>
            </div>
            <p class="mb-0 small text-muted text-right">
              請先選擇區域查看（綠色表示還有口罩）
            </p>
          </div>
          <ul class="list-group">
            <template>
              <a class="list-group-item text-left">
                <h3>藥局名稱</h3>
                <p class="mb-0">成人口罩：1 | 兒童口罩：2</p>
                <p class="mb-0">
                  地址：
                  <a
                    href="https://www.google.com.tw/maps/place/..."
                    target="_blank"
                    title="Google Map"
                  >
                    地址
                  </a>
                </p>
              </a>
            </template>
          </ul>
        </div>
      </div>
      <!-- 右側地圖 -->
      <div class="col-sm-9">
        <div id="map"></div>
      </div>
    </div>
  </div>
</template>

<script>
import L from 'leaflet';
import CityName from './assets/TaiwanArea.json';

let osmMap = {};

const iconsConfig = {
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [1, -40],
  shadowSize: [40, 40],
};

const icons = {
  green: new L.Icon({
    iconUrl: 'images/marker-green.png',
    shadowUrl: 'images/marker-shadow.png',
    ...iconsConfig,
  }),
  red: new L.Icon({
    iconUrl: 'images/marker-red.png',
    shadowUrl: 'images/marker-shadow.png',
    ...iconsConfig,
  }),
  grey: new L.Icon({
    iconUrl: 'images/marker-grey.png',
    shadowUrl: 'images/marker-shadow.png',
    ...iconsConfig,
  }),
};

export default {
  name: 'App',
  data() {
    return {
      maskData: [],
      CityName,
      select: {
        city: '臺北市',
        area: '中正區',
      },
    };
  },
  mounted() {
    osmMap = L.map('map', {
      center: [25.03, 121.55], // 臺北市座標
      zoom: 16,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(osmMap);

    // 取得藥局資料
    const api = 'https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json';
    this.axios.get(api).then((res) => {
      this.maskData = res.data.features;
      this.updateMapMarker();
    });
  },
  methods: {
    updateMapMarker() {
      const pharmacies = this.maskData.filter((pharmacy) => {
        if (!this.select.area) {
          return pharmacy.properties.county === this.select.city;
        }
        return pharmacy.properties.town === this.select.area;
      });

      pharmacies.forEach((pharmacy) => {
        const { properties, geometry } = pharmacy;
        const icon = properties.mask_adult || properties.mask_child ? icons.green : icons.grey;
        L.marker([
          geometry.coordinates[1],
          geometry.coordinates[0],
        ], { icon }).addTo(osmMap).bindPopup(`
          <h4>藥局名稱：${properties.name}</h4>
          <div class="flex">
            <div>成人 - ${properties.mask_adult ? `${properties.mask_adult} 個` : '未取得資料'}</div>
            <div>兒童 - ${properties.mask_child ? `${properties.mask_child} 個` : '未取得資料'}</div>
          </div>
          <a href="https://www.google.com.tw/maps/place/${properties.address}" target="_blank">${properties.address}</a>
          <small>最後更新時間：${properties.updated}</small>
        `);
      });
      this.penTo(pharmacies[0]);
    },
    updateSelect() {
      this.removeMarker();
      this.updateMapMarker();
    },
    penTo(pharmacy) {
      const { properties, geometry } = pharmacy;
      const icon = properties.mask_adult || properties.mask_child ? icons.green : icons.grey;
      osmMap.panTo(new L.LatLng(geometry.coordinates[1], geometry.coordinates[0]));

      L.marker([
        geometry.coordinates[1],
        geometry.coordinates[0],
      ], { icon }).addTo(osmMap).bindPopup(`
        <h4>藥局名稱：${properties.name}</h4>
        <div class="flex">
          <div>成人 - ${properties.mask_adult ? `${properties.mask_adult} 個` : '未取得資料'}</div>
          <div>兒童 - ${properties.mask_child ? `${properties.mask_child} 個` : '未取得資料'}</div>
        </div>
        <a href="https://www.google.com.tw/maps/place/${properties.address}" target="_blank">${properties.address}</a>
        <small>最後更新時間：${properties.updated}</small>
      `).openPopup();
    },
    removeMarker() {
      osmMap.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          osmMap.removeLayer(layer);
        }
      });
    },
  },
};
</script>

<style lang="scss">
@import "bootstrap/scss/bootstrap";

#map {
  height: 100vh;
}
.highlight {
  background: #e9ffe3;
}
.toolbox {
  height: 100vh;
  overflow-y: auto;
  a {
    cursor: pointer;
  }
}
</style>
