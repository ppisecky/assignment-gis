import { shallowMount, mount, createLocalVue } from '@vue/test-utils'
import MapComponent from '../../components/map'
import ElementUI from 'element-ui';
import { places } from './__mocks__/mockedData'
import flushPromises from 'flush-promises'
import { randomPlace, randomSquare } from './helpers'

const localVue = createLocalVue();
localVue.use(ElementUI);

const mockAxios = { $get: () => Promise.resolve({}) }
const shallowMountMap = (settings = {}) => {
    const defaultSettings = {
        localVue, 
        mocks: { $axios: mockAxios }
    }
    return shallowMount(MapComponent, { ...defaultSettings, ...settings })
}

const freshMountMap = (settings = {}) => {
    const freshLocalVue = createLocalVue();
    freshLocalVue.use(ElementUI);

    const mocks = { $axios: mockAxios }
    return mount(MapComponent, { ...{ localVue: freshLocalVue, mocks, stubs: ['el-select', 'el-option'] }, ...settings })
}

describe('map', () => {
    it('mounts properly', () => {
        // given

        // when
        const testSubject = shallowMountMap()

        // then
        expect(testSubject.isVueInstance()).toBeTruthy()
    })


    it('creates a map instance upon mounting', () => {
        // given

        // when
        let testSubject = MapComponent

        // then
        expect(typeof testSubject.mounted).toBe('function')
        testSubject = shallowMountMap()
        expect(testSubject.vm.map).not.toBe(null)
    })

    

    it('renders correctly', () => {
        // given

        // when
        const testSubject = freshMountMap()

        // then
        expect(testSubject).toMatchSnapshot();
    })
})