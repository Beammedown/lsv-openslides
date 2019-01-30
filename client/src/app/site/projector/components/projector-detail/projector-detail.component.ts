import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { ProjectorRepositoryService, ScrollScaleDirection } from '../../services/projector-repository.service';
import { ViewProjector } from '../../models/view-projector';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ProjectorService } from 'app/core/services/projector.service';
import { moveItemInArray, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ProjectorElement } from 'app/shared/models/core/projector';
import { SlideManager } from 'app/slides/services/slide-manager.service';
import { CountdownRepositoryService } from 'app/site/common/services/countdown-repository.service';
import { ProjectorMessageRepositoryService } from 'app/site/common/services/projectormessage-repository.service';
import { ViewProjectorMessage } from 'app/site/common/models/view-projectormessage';
import { ViewCountdown } from 'app/site/common/models/view-countdown';
import { Projectable } from 'app/site/base/projectable';
import { CurrentListOfSpeakersSlideService } from '../../services/current-list-of-of-speakers-slide.service';

/**
 * The projector detail view.
 */
@Component({
    selector: 'os-projector-detail',
    templateUrl: './projector-detail.component.html',
    styleUrls: ['./projector-detail.component.scss']
})
export class ProjectorDetailComponent extends BaseViewComponent implements OnInit {
    /**
     * The projector to show.
     */
    public projector: ViewProjector;

    public scrollScaleDirection = ScrollScaleDirection;

    public countdowns: ViewCountdown[] = [];

    public messages: ViewProjectorMessage[] = [];

    /**
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param repo
     * @param route
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: ProjectorRepositoryService,
        private route: ActivatedRoute,
        private projectorService: ProjectorService,
        private slideManager: SlideManager,
        private countdownRepo: CountdownRepositoryService,
        private messageRepo: ProjectorMessageRepositoryService,
        private currentListOfSpeakersSlideService: CurrentListOfSpeakersSlideService
    ) {
        super(titleService, translate, matSnackBar);

        this.countdownRepo.getViewModelListObservable().subscribe(countdowns => (this.countdowns = countdowns));
        this.messageRepo.getViewModelListObservable().subscribe(messages => (this.messages = messages));
    }

    /**
     * Gets the projector and subscribes to it.
     */
    public ngOnInit(): void {
        super.setTitle('Projector');
        this.route.params.subscribe(params => {
            const projectorId = parseInt(params.id, 10) || 1;
            this.repo.getViewModelObservable(projectorId).subscribe(projector => (this.projector = projector));
        });
    }

    /**
     * Change the scroll
     * @param direction The direction to send.
     */
    public scroll(direction: ScrollScaleDirection): void {
        this.repo.scroll(this.projector, direction).then(null, this.raiseError);
    }

    /**
     * Change the scale
     * @param direction The direction to send.
     */
    public scale(direction: ScrollScaleDirection): void {
        this.repo.scale(this.projector, direction).then(null, this.raiseError);
    }

    public projectNextSlide(): void {
        this.projectorService.projectNextSlide(this.projector.projector).then(null, this.raiseError);
    }

    public projectPreviousSlide(): void {
        this.projectorService.projectPreviousSlide(this.projector.projector).then(null, this.raiseError);
    }

    public onSortingChange(event: CdkDragDrop<ProjectorElement>): void {
        moveItemInArray(this.projector.elements_preview, event.previousIndex, event.currentIndex);
        this.projectorService.savePreview(this.projector.projector).then(null, this.raiseError);
    }

    public removePreviewElement(elementIndex: number): void {
        this.projector.elements_preview.splice(elementIndex, 1);
        this.projectorService.savePreview(this.projector.projector).then(null, this.raiseError);
    }

    public projectNow(elementIndex: number): void {
        this.projectorService.projectPreviewSlide(this.projector.projector, elementIndex).then(null, this.raiseError);
    }

    public getElementDescription(element: ProjectorElement): string {
        if (!this.slideManager.canSlideBeMappedToModel(element.name)) {
            return this.slideManager.getSlideVerboseName(element.name);
        } else {
            const idElement = this.slideManager.getIdentifialbeProjectorElement(element);
            const model = this.projectorService.getModelFromProjectorElement(idElement);
            return model.getTitle();
        }
    }

    public isProjected(obj: Projectable): boolean {
        return this.projectorService.isProjectedOn(obj, this.projector.projector);
    }

    public async project(obj: Projectable): Promise<void> {
        try {
            if (this.isProjected(obj)) {
                await this.projectorService.removeFrom(this.projector.projector, obj);
            } else {
                await this.projectorService.projectOn(this.projector.projector, obj);
            }
        } catch (e) {
            this.raiseError(e);
        }
    }

    public unprojectCurrent(element: ProjectorElement): void {
        const idElement = this.slideManager.getIdentifialbeProjectorElement(element);
        this.projectorService.removeFrom(this.projector.projector, idElement).then(null, this.raiseError);
    }

    public isClosProjected(stable: boolean): boolean {
        return this.currentListOfSpeakersSlideService.isProjectedOn(this.projector, stable);
    }

    public toggleClos(stable: boolean): void {
        this.currentListOfSpeakersSlideService.toggleOn(this.projector, stable);
    }
}