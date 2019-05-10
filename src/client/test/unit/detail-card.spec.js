import { shallowMount, mount, createLocalVue } from '@vue/test-utils'
import DetailCard from '../../components/detail-card'
import ElementUI from 'element-ui';
import { places } from './__mocks__/mockedData'
import flushPromises from 'flush-promises'
import { randomPlace, randomSquare } from './helpers'

const localVue = createLocalVue();
localVue.use(ElementUI);

const mockAxios = { $get: () => Promise.resolve({}) }
const shallowMountDetailCard = (settings = {}) => {
    const defaultSettings = {
        localVue, 
        mocks: { $axios: mockAxios },
        propsData: {
            entity: randomPlace(),
            isSquare: false
        }
    }
    return shallowMount(DetailCard, { ...defaultSettings, ...settings })
}

const freshMountDetailCard = (settings = {}) => {
    const freshLocalVue = createLocalVue();
    freshLocalVue.use(ElementUI);

    const mocks = { $axios: mockAxios }
    return mount(DetailCard, { ...{ localVue: freshLocalVue, mocks }, ...settings })
}

describe('detail card', () => {
    it('mounts properly', () => {
        // given

        // when
        const testSubject = shallowMountDetailCard()

        // then
        expect(testSubject.isVueInstance()).toBeTruthy()
    })

    it('has a mounted hook', () => {
        // given

        // when
        const testSubject = DetailCard

        // then
        expect(typeof testSubject.mounted).toBe('function')
    })

    it('initializes with correct data', () => {
        // given
        const desiredPropertyBlacklist = ['way', 'z_order', 'name']

        // when
        const testSubject = DetailCard
        
        // then
        expect(typeof testSubject.data).toBe('function')
        const defaultData = testSubject.data()
        expect(defaultData.loadingDetail).toBe(false)
        expect(defaultData.propertiesBlacklist).toEqual(expect.arrayContaining(desiredPropertyBlacklist))
    })

    it('emits event on close button click', () => {
        // given
        const propsData = {
            entity: randomPlace(),
            isSquare: false
        }

        // when
        const testSubject = mount(DetailCard, {
            localVue,
            mocks: {$axios: mockAxios},
            propsData
        })

        // then
        expect(testSubject.contains('.close-button')).toBe(true)
        const closeButton = testSubject.find('.close-button')
        closeButton.trigger('click')
        expect(testSubject.emitted()['close-detail']).toBeTruthy()
        expect(testSubject.emitted()['close-detail']).toHaveLength(1)
    })

    it('loads fresh data upon mounting', async () => {
        // given
        const place =  randomPlace()
        const propsData = {
            entity: {
                osm_id: place.osm_id,
                name: place.name,
                tourism: place.tourism
            },
            isSquare: false
        }
        const mocks = {
            $axios: {$get: (p) => Promise.resolve(p.includes('places/'+place.osm_id) ? place : randomSquare())}
        }

        // when
        const testSubject = shallowMountDetailCard({
            propsData,
            mocks
        })
        await flushPromises()

        // then
        expect(testSubject.vm.entityDetail).toBe(place)
    })

    it('loads fresh data upon entity change', async () => {
        // given
        let square =  randomSquare()
        const propsData = {
            entity: {
                osm_id: square.osm_id,
                name: square.name,
                tourism: square.tourism
            },
            isSquare: true
        }
        const mocks = {
            $axios: {$get: (p) => Promise.resolve(p.includes('areas/' + square.osm_id) ? square : randomPlace())}
        }

        // when
        const testSubject = shallowMountDetailCard({
            propsData,
            mocks
        })
        await flushPromises()
        square = randomSquare()
        const changedPropsData = {
            entity: {
                osm_id: square.osm_id,
                name: square.name,
                tourism: square.tourism
            }
        }
        testSubject.setProps(changedPropsData);
        await flushPromises()

        // then
        expect(testSubject.vm.entityDetail).toBe(square)
    })

    it('renders correctly', () => {
        // given
        const props = {
            entity: { "osm_id": "4833390172", "name": "Sina Centurion Palace", "geojson": { "type": "Point", "coordinates": [12.3336169, 45.4309549] }, "tourism": "hotel", "lng": 12.3336169, "lat": 45.4309549 },
            isSquare: false
        }

        // when
        const testSubject = freshMountDetailCard({
            propsData: props
        })

        // then
        expect(testSubject).toMatchSnapshot();
    })
})