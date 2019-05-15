import { Location } from '@angular/common'
import { Component, Input, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { I18nKey } from '@core/i18n/i18n.message'
import { I18NService } from '@core/i18n/i18n.service'
import { formatImportsToSave } from '@shared/variables-import-table/variables-import-table.component'
import { NzMessageService } from 'ng-zorro-antd'
import { Subject } from 'rxjs'

import { ScenarioResponse, ScenarioService } from '../../../api/service/scenario.service'
import { ActorEvent, ActorEventType } from '../../../model/api.model'
import { ContextOptions, JobExecDesc, ReportItemEvent, Scenario } from '../../../model/es.model'
import { PageSingleModel } from '../../../model/page.model'

@Component({
  selector: 'app-scenario-model',
  templateUrl: './scenario-model.component.html',
})
export class ScenarioModelComponent extends PageSingleModel implements OnInit {

  fromSelector = false
  card1BodyStyle = {
    'padding': '12px',
    'background-color': 'white'
  }
  card2BodyStyle = {
    'padding': '12px',
    'background-color': 'snow'
  }
  @Input() group: string
  @Input() project: string
  scenario: Scenario = { steps: [], imports: [], exports: [] }
  scenarioId: string
  scenarioResponse: ScenarioResponse = {}
  submitting = false
  testWs: WebSocket
  logSubject = new Subject<ActorEvent<JobExecDesc>>()
  eventSubject = new Subject<ActorEvent<ReportItemEvent>>()
  consoleDrawerVisible = false
  @Input()
  set id(id: string) {
    if (id) {
      this.fromSelector = true
      this.scenarioId = id
      this.loadDataById()
    }
  }
  _ctxOptions: ContextOptions = {}
  @Input()
  set ctxOptions(val: ContextOptions) {
    if (val) {
      this._ctxOptions = val
    }
  }

  constructor(
    private scenarioService: ScenarioService,
    private msgService: NzMessageService,
    private route: ActivatedRoute,
    private location: Location,
    private i18nService: I18NService,
  ) {
    super()
  }

  test() {
    this.consoleDrawerVisible = true
    if (this.testWs) {
      this.testWs.close()
      this.testWs = null
    }
    this.testWs = this.scenarioService.newTestWs(this.group, this.project, this.scenarioId)
    this.testWs.onopen = (event) => {
      const testMessage = this.validateAndBuild(true)
      const options = { ...this._ctxOptions }
      options.initCtx = undefined
      this.testWs.send(JSON.stringify({ ...testMessage, options: options }))
    }
    this.testWs.onmessage = (event) => {
      if (event.data) {
        try {
          const res = JSON.parse(event.data) as ActorEvent<JobExecDesc & ReportItemEvent>
          if (ActorEventType.ITEM === res.type) {
            this.eventSubject.next(res)
          } else if (ActorEventType.OVER === res.type) {
            // set scenario report
          } else {
            this.logSubject.next(res)
          }
        } catch (error) {
          this.msgService.error(error)
          this.testWs.close()
        }
      }
    }
  }

  submit() {
    const scenario = this.validateAndBuild()
    if (scenario) {
      this.submitting = true
      if (this.scenarioId) {
        this.scenarioService.update(this.scenarioId, scenario).subscribe(res => {
          this.submitting = false
          this.msgService.success(this.i18nService.fanyi(I18nKey.MsgSuccess))
        }, err => this.submitting = false)
      } else {
        this.scenarioService.index(scenario).subscribe(res => {
          this.submitting = false
          this.scenarioId = res.data.id
          this.msgService.success(this.i18nService.fanyi(I18nKey.MsgSuccess))
        }, err => this.submitting = false)
      }
    }
  }

  envChange() {
    this._ctxOptions.scenarioEnv = this.scenario.env
  }

  reset() {
  }

  validateAndBuild(isTest: boolean = false) {
    if (!this.scenario.summary && !isTest) {
      this.msgService.error(this.i18nService.fanyi(I18nKey.ErrorEmptySummary))
      return
    }
    const scenario = { ...this.scenario }
    scenario.imports = formatImportsToSave(scenario.imports)
    return scenario
  }

  goBack() {
    this.location.back()
  }

  loadDataById() {
    if (this.scenarioId) {
      this.scenarioService.getById(this.scenarioId).subscribe(res => {
        this.scenarioResponse = res.data
        this.scenario = res.data.scenario
        this.group = this.scenario.group
        this.project = this.scenario.project
        this._ctxOptions.scenarioEnv = this.scenario.env
        if (!this.scenario.steps) { this.scenario.steps = [] }
      })
    }
  }

  ngOnInit(): void {
    if (this.route.parent && this.route.parent.parent) {
      this.route.parent.parent.params.subscribe(params => {
        this.group = params['group']
        this.project = params['project']
        this.scenario.group = this.group
        this.scenario.project = this.project
      })
      this.route.parent.params.subscribe(params => {
        const scenarioId = params['scenarioId']
        if (scenarioId) {
          this.scenarioId = scenarioId
          this.loadDataById()
        }
      })
    }
  }
}
