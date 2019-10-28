import { Component, OnInit, ChangeDetectorRef, Input, ViewChild } from '@angular/core';
import { map } from 'rxjs/operators';
import { GenericService } from '../../../services/generated.services';

@Component({
  selector: 'slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss']
})
export class SliderComponent implements OnInit {
  @ViewChild('slideshow') slideshow: any;
  sliderUrls : string[] = [];
  sliderIndex : number = 0;

  ngOnInit(): void {
    this.loadSliders();
  }

  constructor(private sliderService: GenericService)
  {

  }

  loadSliders()
  {
    this.sliderService.generalGet("slider",5).pipe(
      map(
        result => {
          if(result.success)
          {
            let urls = [];
            for(let i = 0; i < result.data.length; i++)
            {
              urls.push(result.data[i].value);
            }
            this.sliderUrls = urls;
          }
          else
          {
            console.log("Could not load sliders!");
          }
        }
      )
    ).subscribe();
  }

  indexChanged(event)
  {
    this.sliderIndex = event;
    console.log(event);
  }

  changeIndex(i)
  {
    this.slideshow.goToSlide(this.sliderUrls.length - i - 1)
  }
}