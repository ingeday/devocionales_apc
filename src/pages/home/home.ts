import { StatusBar } from '@ionic-native/status-bar';
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import * as moment from 'moment';
import 'moment/locale/es';
import "rxjs/add/operator/map";
import { SocialSharing } from "@ionic-native/social-sharing";
import { Toast } from '@ionic-native/toast';
//import { HTTP } from '@ionic-native/http';
import { HttpModule, Http, RequestOptions, Headers } from '@angular/http';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

public reproductor:any={
  tiempo:0,
  tiempoTotal:0,
  src:"",
  status:"noaudio", //{"code":{"0":"noaudio","1":"unload","2":"loaded","3":"playing","4":"paused","5":"stopped","6":"finished"}},
  reproduciendo:Boolean
}
header=new Headers();
audio=new Audio();
currentAudio=null;
aumentado=0;
reversed=0;

tt:FirebaseListObservable<any>;
properties=[];
currentRef=[];

  constructor(
    public navCtrl: NavController,
    public fireDatabase: AngularFireDatabase,
    private socialSharing: SocialSharing,
    private toast: Toast,
    private http: Http,
  ) {
    //console.log(moment.locales());
    moment.locale('es');
    console.log("constructor")
    this.tt=this.fireDatabase.list('/devocionales').map(
      (array) =>  array ) as FirebaseListObservable<any[]>;
        this.tt.subscribe(elements=> {
          console.log("Iniciando SUBSCRIBE de firebase")
          console.log("")
          this.properties=[];
          this.mappedProperties=[];
          this.locales=elements.reverse()
        //  this.getAudios();
          elements.forEach((element,index) => {

          //  this.locales.push(element)

            this.properties[element.$key]=({
              key:element.$key,
              tiempoEnReferencia:this.calcularTiempoEnReferencia(element.fecha),
              status:"noaudio"
            });
            this.mappedProperties.push(element.$key);
          });
        });
  }

  urlShortener(longUrl:string) {
    console.log("urlShortener")
    let h = new Headers()
    h.append("Accept","application/json");
    h.append("Content-Type","application/json");
    let options=new RequestOptions({headers:h})
    this.http.post(
      "https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyBWlZ4bif3glEpVuPPuqZ4oF9cXaudMecQ",
      {"longUrl":longUrl},options
      ).subscribe(data=>{
        console.log(1);
        this.shareWhatsapp(JSON.parse(data["_body"]).id)
      }, error=>{
        console.log(2);
        console.log(error);
    });
    /* subscribe(data=>{
        //console.log(JSON.parse(data["_body"]).id)
        return 1; //JSON.parse(data["_body"]).id;
      }, error=>{
        //console.log(error);
        return 2;
    })*/
  }

  buscarTiempoEnRef(key) {
    console.log("buscarTiempoEnRef")
    return this.properties[key].tiempoEnReferencia;
  }

  setPlaying(key) {
    console.log("setPlaying")
    this.properties[key].status="playing";
  }

  isPlaying(key) {
    console.log("isPlaying")
    return (this.properties[key].status==="playing")?true:false;
  }

  calcularTiempoEnReferencia(fechaUnix) {
    console.log("calcularTiempoEnReferencia")
    return moment(fechaUnix).fromNow();
  }

  formatFecha(fechaUnix) {
    console.log("formatFecha")
    return moment(fechaUnix).format('ll');
  }

  setSrcAudio(urlAudio:string) {
    console.log("setSrcAudio")
    this.audio.src=urlAudio;
  }

  formatoTiempo(tiempoEnSegundos) {
    console.log("formatoTiempo")
    let minutosConFraccion=tiempoEnSegundos/60;
    let enteroMinutos=parseInt(minutosConFraccion+"");
    let segundosEnMinutos=minutosConFraccion-parseFloat(enteroMinutos+"");
    let tiempoFormateado=enteroMinutos+":"+parseInt(segundosEnMinutos*60+"");
    return tiempoFormateado;
  }

  setAllPlay() {
    console.log("setAllPlay")
    this.mappedProperties.forEach((elements)=>{
      this.properties[elements].status="paused";
    }) 
  }

  play(ref) {
    console.log("play")
    this.setAllPlay();
    if(this.reproductor.status==="paused") {
      console.log("Va el tiempo: "+this.audio.currentTime)
    } else {
      this.currentRef=ref.$key;
      this.setSrcAudio(ref.audio);
      this.audio.load();
      this.currentAudio=ref;
    }
    this.setPlaying(ref.$key);
    this.reproductor.status="playing";
    this.audio.play();
    this.tempo();
    console.log(this.reproductor);
  }

  aumentar(audio) {
    console.log("aumentar")
    audio.reproducciones+=1;
    this.tt.update(audio.$key,{reproducciones:audio.reproducciones});
  }

  like(audio) {
    console.log("like")
    audio.likes=(audio.likes)?audio.likes+1:1;
    this.tt.update(audio.$key,{likes:audio.likes});
  }

  tempo() {
    console.log("tempo")
    this.audio.ontimeupdate=(a)=>{
      console.log("tempo > ontimeupdate")
      this.reproductor.tiempoTotal=this.audio.duration;
      this.reproductor.tiempo=this.audio.currentTime;
      if(this.audio.currentTime>this.audio.duration/2 && this.aumentado===0) {
        this.aumentado=1;
        this.aumentar(this.currentAudio);
      }
    }
    this.audio.onended=()=>{
      this.aumentado=0; // Habilita para aumentar otra vez
    }
  }


  setTimeAudio(time) {
    console.log("setTimeAudio")
    this.audio.currentTime=time;
  }

  shareWhatsapp(audio) {
    console.log("shareWhastapp")
    console.log("sharing")
    this.socialSharing.canShareVia("com.whatsapp").then(() => {
      this.toast.show('Puede compartir', '5000', 'center').subscribe(
        toast => {
         // console.log(toast);
        }
      );
      this.socialSharing.shareVia("com.whatsapp","Escucha el devocional APC de hoy:  "+audio).then().catch((e)=>{
        this.toast.show(e, '5000', 'center').subscribe(
        toast => {
       //   console.log(toast);
        }
      );
      });
    }).catch((e) => {
      this.toast.show(e, '5000', 'center').subscribe(
        toast => {
       //   console.log(toast);
        }
      );
    });
  }

  setPause(key) {
    console.log("setPause")
    this.properties[key].status="paused";
    //this.setAllPause();
  }

  setAllPause() {
    console.log("setAllPause")
    console.log(this.properties.length)
  }
  pause() {
    console.log("pause")
    this.setPause(this.currentRef);
    this.reproductor.status="paused";
    this.audio.pause();
  }
  stop() {
    console.log("stop")
    this.pause();
    this.audio.currentTime=0;
  }
  mappedProperties=[];
  ionViewDidLoad() {
    console.log("ionViewDidLoad")

        this.tt.subscribe().unsubscribe();
  }

  locales=[];
  getAudios() {
    console.log("getAudios")
    this.locales=[];
     this.tt.subscribe(a=> {
       this.locales=a.reverse();
     })
  }

  ionViewWillEnter() {
    console.log("ionViewWillEnter")

  }

  ionViewDidEnter() {
    console.log("ionViewDidEnter")
    this.tt.subscribe().unsubscribe();
    console.log("ionViewDidEnter > unsubscribe")
  }

  ionViewWillLeave() {
    console.log("ionViewWillLeave")
  }

  ionViewDidLeave() {
    console.log("ionViewDidLeave")
  }

  ionViewWillUnload() {
    console.log("ionViewWillUnload")
  }

  ionViewCanEnter() {
    console.log("ionViewCanEnter")
  }

  ionViewCanLeave() {
    console.log("ionViewCanLeave")
  }
  

}
