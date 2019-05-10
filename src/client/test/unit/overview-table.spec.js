import { shallowMount, mount, createLocalVue } from '@vue/test-utils'
import OverviewTable from '../../components/overview-table'
import ElementUI from 'element-ui';
import { regions } from './__mocks__/mockedData'
import { randomRegionLevel, arrRandIndex } from './helpers'

const localVue = createLocalVue();
localVue.use(ElementUI);

const shallowMountOverviewTable = (settings = {}) => shallowMount(OverviewTable, { ...{ localVue }, ...settings })

describe('region overview table', () => {
    it('mounts properly', () => {
        // when
        const testSubject = shallowMountOverviewTable()

        // then
        expect(testSubject.isVueInstance()).toBeTruthy()
    })

    it('displays warning without data', () => {
        // when
        const testSubject = shallowMountOverviewTable()

        // then
        expect(testSubject.props().overview).toBe(undefined)
        expect(testSubject.props().levelHasCapitals).toBe(undefined)
        expect(testSubject.contains('div.warning')).toBe(true)
    })

    it('displays overview level in title', () => {
        // given
        const regionLevel = randomRegionLevel()
        const props = {
            overview: {
                level: regionLevel,
                data: []
            }
        }

        // when
        const testSubject = shallowMountOverviewTable({
            propsData: props
        })

        // then
        expect(testSubject.props().overview.level).toBe(regionLevel)
        expect(testSubject.contains('h2')).toBe(true)
        expect(testSubject.find('h2').text().includes(regionLevel)).toBe(true)
    })

    it('displays number of regions in title', () => {
        // given
        const props = {
            overview: {
                level: 'foo',
                data: regions
            }
        }

        // when
        const testSubject = shallowMountOverviewTable({
            propsData: props
        })

        // then
        expect(testSubject.contains('h2')).toBe(true)
        expect(testSubject.find('h2 small').text().includes(regions.length)).toBe(true)
    })

    it('renders table with proper number of columns', () => {
        // given
        const props = {
            overview: {
                level: 'regions',
                data: regions
            },
            levelHasCapitals: true
        }

        // when
        const testSubject = mount(OverviewTable, {
            localVue,
            propsData: props
        })

        // then
        expect(testSubject.contains('table')).toBe(true)
        expect(testSubject.findAll('div.el-table__header-wrapper table th')).toHaveLength(5)
        testSubject.setProps({ levelHasCapitals: false })
        expect(testSubject.findAll('div.el-table__header-wrapper table th')).toHaveLength(4)
    })

    it('renders table with proper number of rows', () => {
        // given
        const props = {
            overview: {
                level: 'regions',
                data: regions
            },
            levelHasCapitals: true
        }

        // when
        const testSubject = mount(OverviewTable, {
            localVue,
            propsData: props
        })

        // then
        expect(testSubject.findAll('#overview-table div.el-table__body-wrapper > table > tbody > tr').length).toBe(regions.length)
    })

    it('emits data on region select', () => {
        // given 
        const props = {
            overview: {
                level: 'regions',
                data: regions
            },
            levelHasCapitals: true
        }

        // when
        const testSubject = mount(OverviewTable, {
            localVue,
            propsData: props
        })
        const displayedRows = testSubject.findAll('#overview-table div.el-table__body-wrapper > table > tbody > tr')
        const rowIdx = arrRandIndex(displayedRows)
        displayedRows.at(rowIdx).trigger('click')

        // then
        expect(testSubject.emitted().areaSelected).toBeTruthy()
        expect(testSubject.emitted().areaSelected).toHaveLength(1)
        expect(testSubject.emitted().areaSelected[0]).toEqual([props.overview.data[rowIdx]])
    })

    it('renders correctly', () => {
        // given
        const props = {
            overview: {
                level: 'regions',
                data: regions
            },
            levelHasCapitals: true
        }

        // when
        const freshLocalVue = createLocalVue();
        freshLocalVue.use(ElementUI);
        const testSubject = mount(OverviewTable, {
            localVue: freshLocalVue,
            propsData: props
        })

        // then
        expect(testSubject).toMatchSnapshot();
    })
})