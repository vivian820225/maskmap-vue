<template>
  <div id="app">
    <div class="row no-gutters">
      <!-- 左側搜尋 -->
      <div class="col-sm-3">
        <div class="toolBox">
          <vuescroll :ops="ops">
            <div class="sticky-top bg-white shadow-sm pt-4 pb-2 px-3">
              <div id="logo" class="mb-4">
                <img src="@/assets/logo.png" alt="MaskMap口罩地圖">
              </div>
              <h2 class="h4">請選擇欲查詢的區域</h2>
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
              <hr>
              <h2 class="h4">使用關鍵字搜尋</h2>
              <div class="form-group position-relative">
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="請輸入關鍵字"
                    aria-label="關鍵字搜尋"
                    v-model.trim="keywords"
                    @click.stop="searchFocus = true"
                    @blur="searchFocus = false"
                  >
                  <div class="input-group-append">
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="searchKeyword"
                    >
                      查詢
                    </button>
                  </div>
                </div>
                <!-- 儲存至 localStorage 紀錄 -->
                <ul class="searchBar" v-if="searchFocus">
                  <li class="clearStorage">
                    <span>清除搜尋紀錄</span>
                  </li>
                </ul>
              </div>
              <p class="mb-0 small text-muted text-right">
                <span v-if="filterData.length">共有 <span>{{ filterData.length }}</span> 項符合條件</span>
                <span v-else>無符合條件的項目</span>
              </p>
            </div>
            <ul class="list-group p-2">
              <template v-for="(item, i) in filterData">
                <li
                  :key="i"
                  class="list-group-item text-left"
                  @click="penTo(item)"
                >
                  <h3>{{ item.properties.name }}</h3>
                  <p class="mb-0">
                    成人口罩：{{ item.properties.mask_adult }} |
                    兒童口罩：{{ item.properties.mask_child }}
                  </p>
                  <p class="mb-0">
                    地址：
                    <a
                      :href="`https://www.google.com.tw/maps/place/${item.properties.address}`"
                      target="_blank"
                      title="Google Map"
                    >
                      {{ item.properties.address }}
                    </a>
                  </p>
                </li>
              </template>
            </ul>
          </vuescroll>
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
import vuescroll from 'vuescroll';
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
      filterData: [],
      CityName,
      select: {
        city: '臺北市',
        area: '北投區',
      },
      searchFocus: false,
      keywords: '',
      ops: {
        rail: {
          opacity: '0.2',
          background: '#F5F5F5',
          border: undefined,
          size: '6px',
        },
        bar: {
          background: '#9BC9FF',
          keepShow: false,
          size: '4px',
          minSize: 0.2,
        },
      },
    };
  },
  components: {
    vuescroll,
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
        if (pharmacy.properties.county === this.select.city) {
          return pharmacy.properties.town === this.select.area;
        }
        return null; // 避免同區不同市的資料呈現
      });

      this.filterData = pharmacies;
      this.setMarker(pharmacies);
      this.penTo(pharmacies[0]);
    },
    setMarker(pharmacies) {
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
    },
    updateSelect() {
      this.removeMarker();
      this.updateMapMarker();
    },
    searchKeyword() {
      this.removeMarker();
      const pharmacies = this.maskData.filter((pharmacy) => (
        pharmacy.properties.name.includes(this.keywords)
      ));

      this.filterData = pharmacies;
      this.setMarker(pharmacies);
      this.keywords = '';
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
.toolBox {
  height: 100vh;
  background-color: #F5F5F5;
  a {
    cursor: pointer;
  }
}
.list-group-item {
  cursor: pointer;
}
</style>
