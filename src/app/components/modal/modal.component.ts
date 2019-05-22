import { OnInit, Component, OnDestroy, ElementRef, ChangeDetectorRef } from "@angular/core";
import { ModalService } from "../../services/modal.service";
import { ElectronService } from "../../providers/electron.service";

@Component({
    selector: 'modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss']
  })
  export class ModalComponent implements OnInit, OnDestroy
  {
    private element: any;
    public opened: boolean = false;
    contents : string = "";

    constructor(public modalService : ModalService, private el : ElementRef,private ref: ChangeDetectorRef)
    {
        this.element = el.nativeElement;
    }

    ngOnInit(): void 
    {
        let el1 = this;
        document.body.appendChild(this.element);

        this.element.addEventListener('click', function (e: any) {
            /*
            if (e.target.className !== 'modal') {
                this.close();
            }
            */
           el1.close();
        });

        this.modalService.setRef(this);
        this.notifyChanges();
    }    

    ngOnDestroy(): void 
    {
        this.modalService.close();
        this.element.remove();
    }

    open()
    {
        this.element.style.display = 'block';
        document.body.classList.add('modal-open');
        this.opened = true;
    }

    close()
    {
        this.element.style.display = 'none';
        document.body.classList.remove('modal-open');
        this.modalService.resetMessages();
        this.opened = false;
        console.log('yeee')
    }

    notifyChanges()
    {
        this.contents = this.modalService.messages.join('\n----------------------------\n')
        console.log(this.contents);
        this.ref.detectChanges();
    }
  }